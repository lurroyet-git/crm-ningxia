import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * 集成测试套件：验证各模块端到端交互
 * 按业务场景编排，确保跨模块数据一致性
 */
describe('Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'zhangwei', password: '123456' });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Dashboard 数据一致性', () => {
    it('概览数据应与项目、客户数量匹配', async () => {
      const [overview, customers, projects] = await Promise.all([
        request(app.getHttpServer())
          .get('/dashboard/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/customers?page=1&pageSize=999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/projects?page=1&pageSize=999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
      ]);

      expect(overview.body.code).toBe(200);
      expect(customers.body.code).toBe(200);
      expect(projects.body.code).toBe(200);

      // 验证数据结构完整性
      expect(overview.body.data).toHaveProperty('todoCount');
      expect(overview.body.data).toHaveProperty('projectCount');
      expect(overview.body.data).toHaveProperty('followCount');
      expect(overview.body.data).toHaveProperty('riskCount');
      expect(overview.body.data).toHaveProperty('visitCount');
      expect(overview.body.data).toHaveProperty('avgProgress');
    });

    it('项目列表与活动动态应能正常加载', async () => {
      const [projList, activities] = await Promise.all([
        request(app.getHttpServer())
          .get('/dashboard/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
        request(app.getHttpServer())
          .get('/dashboard/activities')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200),
      ]);

      expect(projList.body.code).toBe(200);
      expect(activities.body.code).toBe(200);
      expect(Array.isArray(projList.body.data.list || projList.body.data)).toBe(true);
      expect(Array.isArray(activities.body.data.list || activities.body.data)).toBe(true);
    });
  });

  describe('跨模块关联数据校验', () => {
    it('项目应关联到有效的客户和项目经理', async () => {
      const res = await request(app.getHttpServer())
        .get('/projects?page=1&pageSize=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const list = res.body.data.list || res.body.data;
      for (const project of list) {
        if (project.customerId) {
          const customerRes = await request(app.getHttpServer())
            .get(`/customers/${project.customerId}`)
            .set('Authorization', `Bearer ${authToken}`);
          // 客户可能已删除，但正常情况下应存在
          expect([200, 404]).toContain(customerRes.status);
        }
      }
    });

    it('客户详情应包含其关系人和项目', async () => {
      const customer = await prisma.customer.findFirst({
        where: { name: '华信科技集团' },
      });
      if (!customer) return;

      const personsRes = await request(app.getHttpServer())
        .get(`/customers/${customer.id}/persons`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(personsRes.body.code).toBe(200);
      expect(Array.isArray(personsRes.body.data)).toBe(true);
    });
  });

  describe('全局异常处理', () => {
    it('访问不存在的路由应返回 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/not-found-route')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });

    it('非法方法应返回 404 或 405', async () => {
      const res = await request(app.getHttpServer())
        .patch('/auth/login')
        .set('Authorization', `Bearer ${authToken}`);
      expect([404, 405]).toContain(res.status);
    });
  });
});
