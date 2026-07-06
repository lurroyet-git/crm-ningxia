import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 服务已启动: http://localhost:${port}`);
  console.log(`📚 API文档: http://localhost:${port}/api-docs`);
}
bootstrap();
