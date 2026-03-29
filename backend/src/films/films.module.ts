import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { Film, FilmSchema } from './schemas/film.schema';
import { MongodbFilmsRepository } from './repository/mongodb-films.repository';
import { FILMS_REPOSITORY } from '../common/constants';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Регистрируем схему Mongoose для работы с коллекцией фильмов
    // Создаёт модель Mongoose на основе FilmSchema под именем Film.name
    // После регистрации модель становится доступна для внедрения через `${Film.name}Model`
    MongooseModule.forFeature([{ name: Film.name, schema: FilmSchema }]),
  ],
  // Регистрируем контроллер модуля — обрабатывает HTTP‑запросы по эндпоинтам фильмов
  controllers: [FilmsController],
  providers: [
    // Основной сервис бизнес‑логики для работы с фильмами
    FilmsService,
    {
      // Определяем кастомный провайдер с токеном FILMS_REPOSITORY
      // Этот токен будет использоваться для внедрения зависимости в другие сервисы
      provide: FILMS_REPOSITORY,
      // Используем фабричную функцию для динамического создания экземпляра репозитория
      // Позволяет выбирать реализацию репозитория в зависимости от конфигурации приложения
      useFactory: (
        // Внедряем ConfigService — стандартный сервис NestJS для работы с конфигурацией
        configService: ConfigService,
        // Внедряем автоматически созданную модель Mongoose для схемы Film
        // Будет предоставлена MongooseModule после регистрации схемы
        filmModel: any
      ) => {
        // Получаем драйвер базы данных из конфигурации (например, 'mongodb')
        // Если переменная DATABASE_DRIVER не задана, используем значение по умолчанию 'mongodb'
        const dbDriver = configService.get<string>('DATABASE_DRIVER', 'mongodb');

        // В зависимости от значения драйвера выбираем реализацию репозитория
        switch (dbDriver) {
          case 'mongodb':
            // Если драйвер — MongoDB, создаём экземпляр MongoDB‑репозитория
            // Передаём ему модель Mongoose для взаимодействия с коллекцией фильмов в БД
            return new MongodbFilmsRepository(filmModel);
          default:
            // Если указанный драйвер не поддерживается, выбрасываем ошибку
            // Это предотвращает запуск приложения с некорректной конфигурацией БД
            throw new Error(`Unsupported database driver: ${dbDriver}. Supported: mongodb`);
        }
      },
      // Указываем зависимости, которые нужно внедрить в фабричную функцию
      // ConfigService — для доступа к конфигурации приложения
      // `${Film.name}Model` — автоматически созданная модель Mongoose для схемы Film
      inject: [ConfigService, `${Film.name}Model`],
    },
  ],
  // Экспортируем сервисы, чтобы другие модули могли их использовать
  // FilmsService — основной сервис работы с фильмами (бизнес‑логика)
  // FILMS_REPOSITORY — абстракция репозитория для работы с данными фильмов
  // Другие модули могут импортировать FilmsModule и внедрять эти зависимости
  exports: [FilmsService, FILMS_REPOSITORY],
})
export class FilmsModule {}
