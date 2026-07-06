import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

/**
 * 认证模块 E2E 测试套件
 * 覆盖：登录流程、Token校验、401/403场景
 */
describe('AuthController (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('应成功登录并返回 accessToken 和用户信息', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'zhangwei', password: '123456' })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe('zhangwei');
      expect(res.body.data.user.realName).toBe('张伟');
      authToken = res.body.data.accessToken;
    });

    it('密码错误时应返回 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'zhangwei', password: 'wrongpassword' })
        .expect(401);
    });

    it('用户名不存在时应返回 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'notexistuser', password: '123456' })
        .expect(401);
    });

    it('缺少密码时应返回 400', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'zhangwei' })
        .expect(400);
    });

    it('缺少用户名时应返回 400', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: '123456' })
        .expect(400);
    });
  });

  describe('Token 校验', () => {
    it('携带有效 Token 访问受保护接口应成功', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.data.username).toBe('zhangwei');
    });

    it('未携带 Token 访问受保护接口应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('携带无效 Token 应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });

    it('Token 格式错误（缺少 Bearer）应返回 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `${authToken}`)
        .expect(401);
    });
  });

  describe('禁用账号登录', () => {
    it('禁用状态的账号应无法登录', async () => {
      // 先创建一个禁用用户
      const hashedPassword =
        '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrE2XQXnQGK8Y0L1xW2Y6h9Y0X0X0a'; // 123456 的 hash
      const disabledUser = await prisma.user.create({
        data: {
          username: 'disabled_test_user',
          password: hashedPassword,
          realName: '禁用测试用户',
          roleId: (await prisma.role.findFirst({ where: { code: 'pm' } }))!.id,
          status: 0, // 禁用
        },
      });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'disabled_test_user', password: '123456' })
        .expect(401);

      // 清理
      await prisma.user.delete({ where: { id: disabledUser.id } });
    });
  });
});
