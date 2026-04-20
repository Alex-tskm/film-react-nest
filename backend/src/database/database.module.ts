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
        const databaseUrl = config.get<string>('DATABASE_URL');
        const username = config.get<string>('DATABASE_USERNAME');
        const password = config.get<string>('DATABASE_PASSWORD');

        // Встраиваем credentials в URL, чтобы TypeORM не перекрывал их пустыми значениями из URL
        const url = new URL(databaseUrl);
        if (username) url.username = encodeURIComponent(username);
        if (password) url.password = encodeURIComponent(password);

        // Логируем типы и значения параметров (для отладки — убрать в продакшене!)
        console.log('=== DATABASE CONFIGURATION DEBUG ===');
        console.log(
          'DATABASE_URL type:',
          typeof url,
          'value:',
          url,
        );
        console.log(
          'DATABASE_USERNAME type:',
          typeof url.username,
          'value:',
          url.username,
        );
        console.log(
          'DATABASE_PASSWORD type:',
          typeof url.password,
          'value:',
          url.password,
        );
        console.log('==================================');


        return {
          type: 'postgres',
          url: url.toString(),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: process.env.NODE_ENV !== 'production',
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([FilmEntity, ScheduleEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
