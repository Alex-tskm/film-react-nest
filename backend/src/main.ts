import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import express, { Application } from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { RequestMethod } from '@nestjs/common';

// Инициализируем dotenv до создания приложения
config();

async function bootstrap() {
  try {
    const app: Application = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(app),
      {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      },
    );

    // Устанавливаем глобальный префикс для всех API‑эндпоинтов
    nestApp.setGlobalPrefix('api/afisha', {
      exclude: [
        { path: 'content', method: RequestMethod.ALL },
        { path: 'content/(.*)', method: RequestMethod.ALL },
      ],
    });

    // Включаем CORS для разрешения кросс‑доменных запросов
    nestApp.enableCors();

    // Получаем порт из переменных окружения или используем 3000 по умолчанию
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

    await nestApp.listen(port);

    console.log(
      `🚀 Application is running on: http://localhost:${port}/api/afisha`,
    );
    console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `📁 Static files available at: http://localhost:${port}/content/afisha/`,
    );
  } catch (error) {
    console.error('❌ Failed to start the application:', error);
    process.exit(1);
  }
}

bootstrap();
