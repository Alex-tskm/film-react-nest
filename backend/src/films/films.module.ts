import { Module } from '@nestjs/common';
import { Model } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { Film, FilmSchema, FilmDocument } from './schemas/film.schema';
import { MongodbFilmsRepository } from '../repository/mongodb-films.repository';
import { FILMS_REPOSITORY } from '../common/constants';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Регистрируем модель Mongoose для схемы Film — становится доступна как `${Film.name}Model`
    MongooseModule.forFeature([{ name: Film.name, schema: FilmSchema }]),
  ],
  // Контроллер для обработки HTTP‑запросов по эндпоинтам фильмов
  controllers: [FilmsController],
  providers: [
    // Сервис бизнес‑логики работы с фильмами
    FilmsService,
    {
      // Провайдер репозитория с токеном FILMS_REPOSITORY для внедрения зависимостей
      provide: FILMS_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        filmModel: Model<FilmDocument>,
      ) => {
        // Получаем драйвер БД из конфигурации (по умолчанию — 'mongodb')
        const dbDriver = configService.get<string>('DATABASE_DRIVER', 'mongodb');

        switch (dbDriver) {
          case 'mongodb':
            // Для MongoDB используем соответствующий репозиторий
            return new MongodbFilmsRepository(filmModel);
          default:
            // Ошибка при неподдерживаемом драйвере — предотвращает запуск с некорректной конфигурацией
            throw new Error(`Unsupported database driver: ${dbDriver}. Supported: mongodb`);
        }
      },
      // Зависимости для фабрики: ConfigService и модель Film
      inject: [ConfigService, `${Film.name}Model`],
    },
  ],
  // Экспортируем сервисы для использования в других модулях
  exports: [FilmsService, FILMS_REPOSITORY],
})
export class FilmsModule {}
