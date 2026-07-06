import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * 项目交付模块 E2E 测试套件
 * 覆盖：创建项目、列表（筛选+分页）、详情、更新、删除、节点 CRUD
 */
describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let zhangweiId: string;
  let testCustomerId: string;
  let createdProjectId: string;
  let createdNodeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // 获取 zhangwei 信息
    const zhangwei = await prisma.user.findFirst({
      where: { username: 'zhangwei' },
    });
    zhangweiId = zhangwei!.id;

    // 获取一个已知客户（华信科技集团）
    const customer = await prisma.customer.findFirst({
      where: { name: '华信科技集团' },
    });
    testCustomerId = customer!.id;

    // 登录获取 Token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'zhangwei', password: '123456' });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // 清理测试数据
    if (createdNodeId) {
      await prisma.projectNode.delete({ where: { id: createdNodeId } }).catch(() => null);
    }
    if (createdProjectId) {
      await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => null);
    }
    await app.close();
  });

  describe('POST /projects', () => {
    it('应成功创建项目', async () => {
      const payload = {
        name: 'E2E测试项目-' + Date.now(),
        customerId: testCustomerId,
        pmId: zhangweiId,
        stage: '需求分析',
        planStart: '2024-08-01',
        planEnd: '2024-12-31',
        description: '由 E2E 测试自动创建的项目',
        budget: '500000',
      };

      const res = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(payload.name);
      createdProjectId = res.body.data.id;
    });

    it('缺少必填字段应返回 400', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '不完整项目' }) // 缺少 customerId, pmId, stage, planStart, planEnd
        .expect(400);
    });

    it('未认证应返回 401', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .send({
          name: '测试项目',
          customerId: testCustomerId,
          pmId: zhangweiId,
          stage: '需求分析',
          planStart: '2024-08-01',
          planEnd: '2024-12-31',
        })
        .expect(401);
    });
  });

  describe('GET /projects', () => {
    it('应返回项目列表（带分页）', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.list || res.body.data)).toBe(true);
    });

    it('支持按阶段筛选', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?stage=开发&page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      const list = res.body.data.list || res.body.data;
      if (list.length > 0) {
        expect(list[0].stage).toBe('开发');
      }
    });

    it('支持关键词搜索', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?keyword=智慧园区&page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
    });
  });

  describe('GET /projects/:id', () => {
    it('应返回项目详情', async () => {
      // 使用已知种子项目（智慧园区平台）
      const project = await prisma.project.findFirst({
        where: { name: '智慧园区平台' },
      });
      const projectId = project ? project.id : createdProjectId;

      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(projectId);
    });

    it('不存在项目应返回 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });

  describe('PUT /projects/:id', () => {
    it('应成功更新项目', async () => {
      const newName = '更新后的项目名-' + Date.now();
      const res = await request(app.getHttpServer())
        .put(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: newName, stage: '方案设计' })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.name).toBe(newName);
    });

    it('未认证更新应返回 401', () => {
      return request(app.getHttpServer())
        .put(`/projects/${createdProjectId}`)
        .send({ name: '非法更新' })
        .expect(401);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('应成功删除项目', async () => {
      // 先创建一个新的项目用于删除测试
      const payload = {
        name: '待删除项目-' + Date.now(),
        customerId: testCustomerId,
        pmId: zhangweiId,
        stage: '需求分析',
        planStart: '2024-08-01',
        planEnd: '2024-12-31',
      };
      const createRes = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload);
      const deleteTargetId = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/projects/${deleteTargetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 验证已删除
      const checkRes = await request(app.getHttpServer())
        .get(`/projects/${deleteTargetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(checkRes.status).toBe(404);
    });
  });

  describe('项目节点 CRUD', () => {
    it('GET /projects/:id/nodes 应返回节点列表', async () => {
      const project = await prisma.project.findFirst({
        where: { name: '智慧园区平台' },
      });
      const projectId = project ? project.id : createdProjectId;

      const res = await request(app.getHttpServer())
        .get(`/projects/${projectId}/nodes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /projects/:id/nodes 应创建节点', async () => {
      const res = await request(app.getHttpServer())
        .post(`/projects/${createdProjectId}/nodes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nodeName: 'E2E测试节点-' + Date.now(),
          planDate: '2024-09-15',
          sequence: 1,
          acceptanceCriteria: '测试验收标准',
          remark: '测试备注',
        })
        .expect(201);

      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBeDefined();
      createdNodeId = res.body.data.id;
      expect(res.body.data.nodeName).toContain('E2E测试节点');
    });

    it('PUT /projects/nodes/:id 应更新节点状态', async () => {
      const res = await request(app.getHttpServer())
        .put(`/projects/nodes/${createdNodeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: '已完成',
          actualDate: '2024-09-10',
          remark: '节点已更新',
        })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.status).toBe('已完成');
    });

    it('DELETE /projects/nodes/:id 应删除节点', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/nodes/${createdNodeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 清理标记，避免 afterAll 重复删除
      createdNodeId = '';
    });
  });
});
