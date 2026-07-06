import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全头
  app.use(helmet());
  // 压缩
  app.use(compression());
  // CORS
  app.enableCors({ origin: true, credentials: true });

  // 全局管道：DTO 验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局拦截器：统一响应格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局过滤器：异常处理
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger API 文档
  const config = new DocumentBuilder()
    .setTitle('宁夏CRM作战地图 API')
    .setDescription('宁夏区域客户关系管理系统 - RESTful API 文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 生产环境：提供前端静态文件
  const publicPath = join(__dirname, '..', 'public');
  if (existsSync(publicPath)) {
    app.use(express.static(publicPath));
    // SPA 支持：所有非 API 请求返回 index.html
    app.getHttpAdapter().get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/api-docs')) {
        res.sendFile(join(publicPath, 'index.html'));
      }
    });
    console.log(`📁 静态文件服务: ${publicPath}`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 服务已启动: http://localhost:${port}`);
  console.log(`📚 API文档: http://localhost:${port}/api-docs`);
}
bootstrap();
