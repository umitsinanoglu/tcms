import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

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
    .setDescription('TCMS Backend API documentation for Projects, Suites, TestCases, and Automation Test Run Ingestion')
    .setVersion('1.0')
    .addTag('Projects', 'Proje yönetimi ve klasör ağacı API\'leri')
    .addTag('Suites', 'Klasör yapısı ve sürükle-bırak sıralama API\'leri')
    .addTag('Test Cases', 'Test senaryoları ve adımları API\'leri')
    .addTag('Test Runs & Automation', 'Otomasyon araçları ve manuel koşu API\'leri')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 TCMS Backend Server running on: http://localhost:${port}`);
  console.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
