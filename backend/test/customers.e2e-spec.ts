import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * 客户资产模块 E2E 测试套件
 * 覆盖：创建客户、列表（筛选+分页）、区域分布统计、关系人 CRUD
 */
describe('CustomersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let zhangweiId: string;
  let createdCustomerId: string;
  let createdPersonId: string;

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

    // 登录获取 Token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'zhangwei', password: '123456' });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // 清理测试数据
    if (createdPersonId) {
      await prisma.person.delete({ where: { id: createdPersonId } }).catch(() => null);
    }
    if (createdCustomerId) {
      await prisma.person.deleteMany({ where: { customerId: createdCustomerId } }).catch(() => null);
      await prisma.customer.delete({ where: { id: createdCustomerId } }).catch(() => null);
    }
    await app.close();
  });

  describe('POST /customers', () => {
    it('应成功创建客户', async () => {
      const payload = {
        name: 'E2E测试客户-' + Date.now(),
        type: '企业',
        city: '银川',
        district: '金凤区',
        address: '测试地址 123 号',
        industry: '信息技术',
        grade: 'A',
        healthStatus: '健康',
        creditLevel: 'AAA',
        source: '测试来源',
        annualRevenue: '1000万',
        employeeCount: '50-100',
        ownerId: zhangweiId,
        contactPhone: '13800138000',
        contactEmail: 'test@example.com',
        remark: '由 E2E 测试自动创建',
      };

      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe(payload.name);
      createdCustomerId = res.body.data.id;
    });

    it('缺少必填字段（ownerId）应返回 400', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '无负责人客户' })
        .expect(400);
    });

    it('未认证应返回 401', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .send({
          name: '未认证客户',
          ownerId: zhangweiId,
        })
        .expect(401);
    });
  });

  describe('GET /customers', () => {
    it('应返回客户列表（带分页）', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.list || res.body.data)).toBe(true);
    });

    it('支持按城市筛选', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?city=银川&page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      const list = res.body.data.list || res.body.data;
      if (list.length > 0) {
        expect(list[0].city).toBe('银川');
      }
    });

    it('支持按等级筛选', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?grade=A&page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      const list = res.body.data.list || res.body.data;
      if (list.length > 0) {
        expect(list[0].grade).toBe('A');
      }
    });

    it('支持关键词搜索', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers?keyword=华信&page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
    });
  });

  describe('GET /customers/distribution', () => {
    it('应返回区域分布统计', async () => {
      const res = await request(app.getHttpServer())
        .get('/customers/distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      // 返回数据应为数组（各城市客户数量）
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('未认证应返回 401', () => {
      return request(app.getHttpServer())
        .get('/customers/distribution')
        .expect(401);
    });
  });

  describe('GET /customers/:id', () => {
    it('应返回客户详情', async () => {
      const customer = await prisma.customer.findFirst({
        where: { name: '华信科技集团' },
      });
      const customerId = customer ? customer.id : createdCustomerId;

      const res = await request(app.getHttpServer())
        .get(`/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(customerId);
    });
  });

  describe('PUT /customers/:id', () => {
    it('应成功更新客户', async () => {
      const newName = '更新后的客户-' + Date.now();
      const res = await request(app.getHttpServer())
        .put(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: newName, city: '石嘴山' })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.name).toBe(newName);
    });
  });

  describe('关系人 CRUD', () => {
    it('GET /customers/:id/persons 应返回关系人列表', async () => {
      const res = await request(app.getHttpServer())
        .get(`/customers/${createdCustomerId}/persons`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /customers/:id/persons 应创建关系人', async () => {
      const res = await request(app.getHttpServer())
        .post(`/customers/${createdCustomerId}/persons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试关系人-' + Date.now(),
          position: '技术总监',
          role: '决策人',
          phone: '13900139000',
          email: 'person@example.com',
          influence: 80,
          relationStrength: 70,
          attitude: '支持',
          remark: '由 E2E 测试创建',
        })
        .expect(201);

      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBeDefined();
      createdPersonId = res.body.data.id;
    });

    it('PUT /customers/persons/:id 应更新关系人', async () => {
      const res = await request(app.getHttpServer())
        .put(`/customers/persons/${createdPersonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '更新后的关系人',
          position: 'CTO',
          influence: 90,
          relationStrength: 85,
          attitude: '支持',
        })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.name).toBe('更新后的关系人');
      expect(res.body.data.position).toBe('CTO');
    });

    it('DELETE /customers/persons/:id 应删除关系人', async () => {
      await request(app.getHttpServer())
        .delete(`/customers/persons/${createdPersonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      createdPersonId = '';
    });
  });
});
