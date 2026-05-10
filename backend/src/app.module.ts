import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FilmsModule } from './films/films.module';
import { OrderModule } from './order/order.module';
import * as path from 'path';
import { ContentController } from './content/content.controller';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
@Module({
  imports: [
    // Настраиваем модуль конфигурации NestJS
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot(),
    // Настраиваем статическую отдачу файлов (например, изображений, CSS, JS)
    ServeStaticModule.forRoot({
      // Корневая папка с статическими файлами (относительно текущей директории)
      rootPath: path.join(__dirname, '..', 'public'),
      // URL‑путь, по которому будут доступны статические файлы
      // Например: http://localhost:3000/content/image.jpg
      renderPath: '/content',
      // Исключаем API‑эндпоинты из статической отдачи
      // Запросы к /api/... не будут обрабатываться как статические файлы
      exclude: ['/api/(.*)', '/content/afisha'],
      // Дополнительные опции для статического сервера
      serveStaticOptions: {
        // Отключаем отображение списка файлов (index.html и т. д.)
        index: false,
        // Устанавливаем время кеширования файлов в браузере (1 час)
        // Это снижает нагрузку на сервер за счёт локального кеширования
        maxAge: '1h',
      },
    }),

    // Заменяем MongooseModule на DatabaseModule с TypeORM
    DatabaseModule,

    // Импортируем модуль фильмов — содержит логику работы с фильмами и сеансами
    FilmsModule,
    // Импортируем модуль заказов — содержит логику бронирования билетов
    OrderModule,
  ],
  // Список провайдеров (сервисов, фабрик и т. д.), специфичных для этого модуля
  // В данном случае массив пуст, так как все зависимости импортируются через imports
  providers: [],
  // Список контроллеров этого модуля (в данном случае — пустой)
  // Контроллеры будут добавлены в соответствующих feature‑модулях
  controllers: [ContentController],
  // Экспортируемые токены и провайдеры, доступные для других модулей
  // Здесь ничего не экспортируется, так как модуль является корневым
  exports: [],
})
export class AppModule {}
