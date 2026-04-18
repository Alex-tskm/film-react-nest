import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilmEntity } from '../entities/film.entity';
import { ScheduleEntity } from '../entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        // Получаем параметры подключения
        const databaseUrl = config.get<string>('DATABASE_URL');
        const username = config.get<string>('DATABASE_USERNAME');
        const password = config.get<string | undefined>('DATABASE_PASSWORD');

        // Логируем типы и значения параметров (для отладки — убрать в продакшене!)
        console.log('=== DATABASE CONFIGURATION DEBUG ===');
        console.log(
          'DATABASE_URL type:',
          typeof databaseUrl,
          'value:',
          databaseUrl,
        );
        console.log(
          'DATABASE_USERNAME type:',
          typeof username,
          'value:',
          username,
        );
        console.log(
          'DATABASE_PASSWORD type:',
          typeof password,
          'value:',
          password,
        );
        console.log('==================================');

        // Проверка пароля
        if (typeof password !== 'string') {
          throw new Error(
            `DATABASE_PASSWORD must be a string. Got: ${typeof password}. ` +
              'Check your .env file and configuration.',
          );
        }

        if (!password) {
          throw new Error('DATABASE_PASSWORD is required but not provided');
        }

        return {
          type: 'postgres',
          url: databaseUrl,
          username: username,
          password: password,
          entities: [FilmEntity, ScheduleEntity],
          synchronize: true,
          logging: true, // Включаем логирование запросов к БД
          logger: 'advanced-console', // Более детальное логирование
          extra: {
            // Дополнительные настройки для отладки подключения
            connectionTimeoutMillis: 10000,
            idleInTransactionSessionTimeout: 20000,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([FilmEntity, ScheduleEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
