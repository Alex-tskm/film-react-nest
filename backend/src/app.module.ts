import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { FilmsModule } from './films/films.module';
import { OrderModule } from './order/order.module';
import { MongooseModule } from '@nestjs/mongoose';
import * as path from 'path';
import { ContentController } from './content/content.controller';

@Module({
  imports: [
    // Настраиваем модуль конфигурации NestJS
    ConfigModule.forRoot({
      // Делаем модуль глобальным — его сервисы доступны во всех модулях приложения
      // без необходимости повторного импорта в каждом модуле
      isGlobal: true,
      // Включаем кэширование значений конфигурации для повышения производительности
      cache: true,
      // Указываем путь к файлу с переменными окружения (.env)
      envFilePath: '.env',
      // Функция валидации конфигурации — проверяет обязательные параметры при запуске
      validate: (config) => {
        const errors: string[] = [];

        // Проверяем наличие обязательного параметра DATABASE_DRIVER
        // Если переменная не задана, добавляем ошибку в массив
        if (!config.DATABASE_DRIVER) {
          errors.push('DATABASE_DRIVER is required');
        }
        // Проверяем наличие обязательного параметра PORT
        // Порт необходим для запуска сервера
        if (!config.PORT) {
          errors.push('PORT is required');
        }

        // Если есть ошибки валидации, выбрасываем исключение с описанием проблем
        // Приложение не запустится, пока все обязательные параметры не будут заданы
        if (errors.length > 0) {
          throw new Error(
            `Configuration validation failed: ${errors.join(', ')}`,
          );
        }

        // Возвращаем конфигурацию, если валидация пройдена успешно
        return config;
      },
    }),

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

    // Асинхронно настраиваем подключение к MongoDB на основе конфигурации
    MongooseModule.forRootAsync({
      // Гарантируем, что ConfigModule доступен в контексте этого модуля
      imports: [ConfigModule],
      // Используем фабричную функцию для динамического создания конфигурации подключения
      useFactory: (configService: ConfigService) => ({
        // Получаем строку подключения к БД из переменных окружения через ConfigService
        // Пример значения: mongodb://localhost:27017/afisha
        uri: configService.get<string>('DATABASE_URL'),
      }),
      // Внедряем ConfigService для доступа к конфигурации в фабричной функции
      inject: [ConfigService],
    }),

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
