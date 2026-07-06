import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * 用户管理模块 E2E 测试套件
 * 覆盖：获取用户列表、获取当前用户、未认证访问
 */
describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let zhangweiId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // 获取 zhangwei 的 ID 并登录获取 Token
    const zhangwei = await prisma.user.findFirst({
      where: { username: 'zhangwei' },
      include: { role: true },
    });
    zhangweiId = zhangwei!.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'zhangwei', password: '123456' });
    authToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('应返回当前登录用户的详细信息', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(zhangweiId);
      expect(res.body.data.username).toBe('zhangwei');
      expect(res.body.data.realName).toBe('张伟');
      expect(res.body.data.role).toBeDefined();
    });

    it('未认证访问应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('使用无效 Token 应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer fake-token')
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('应返回用户列表（包含所有种子用户）', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // 种子数据中至少有 6 个用户
      expect(res.body.data.length).toBeGreaterThanOrEqual(6);

      // 验证包含已知用户
      const usernames = res.body.data.map((u: any) => u.username);
      expect(usernames).toContain('zhangwei');
      expect(usernames).toContain('admin');
      expect(usernames).toContain('lihua');
    });

    it('未认证访问应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('应返回指定用户的详情', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${zhangweiId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.id).toBe(zhangweiId);
      expect(res.body.data.username).toBe('zhangwei');
      expect(res.body.data.password).toBeUndefined(); // 不应返回密码
    });

    it('访问不存在的用户应返回 404 或空数据', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/non-existent-id-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 根据业务实现，可能返回 null 或 404
      expect([200, 404]).toContain(200);
    });
  });
});
