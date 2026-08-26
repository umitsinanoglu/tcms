import './prisma/db-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { resolveDatabaseEnv } from './prisma/db-env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Increase payload size limit to 50MB (for base64 screenshots and large execution logs)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // OpenAPI / Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Test Case Management System (TCMS) API')
    .setDescription('TCMS Backend API documentation for Projects, Test Plans, Suites, TestCases, Automation Ingestion, Reports, and RBAC')
    .setVersion('1.0')
    .addTag('Projects', "Proje yönetimi ve klasör ağacı API'leri")
    .addTag('Test Plans', "Test planı ve sürüm kapsam yönetimi API'leri")
    .addTag('Suites', "Klasör yapısı ve sürükle-bırak sıralama API'leri")
    .addTag('Test Cases', "Test senaryoları ve adımları API'leri")
    .addTag('Test Runs & Automation', "Otomasyon araçları ve manuel koşu API'leri")
    .addTag('Reports & Analytics', "Proje, Koşu, Suite ve TestCase analitik ve rapor dışa aktarma (CSV/HTML/JSON) API'leri")
    .addTag('Users & RBAC', "Kullanıcı yönetimi, oturum ve rol tabanlı yetkilendirme (RBAC) API'leri")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const dbConfig = resolveDatabaseEnv();
  console.log(`🚀 TCMS Backend Server running on: http://localhost:${port}`);
  console.log(`🗄️ Active Database Environment: [${dbConfig.environment}]`);
  console.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
