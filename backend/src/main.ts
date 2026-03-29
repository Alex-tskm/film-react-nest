import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// Инициализируем dotenv до создания приложения
dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(express()),
      {
        logger: ['log', 'error', 'warn', 'debug', 'verbose']
      }
    );

    // Устанавливаем глобальный префикс для всех API‑эндпоинтов
    app.setGlobalPrefix('api/afisha');

    // Включаем CORS для разрешения кросс‑доменных запросов
    app.enableCors();

    // Получаем порт из переменных окружения или используем 3000 по умолчанию
    const port = process.env.PORT || 3000;

    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}/api/afisha`);
    console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Static files available at: http://localhost:${port}/content/afisha/`);
  } catch (error) {
    console.error('❌ Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
