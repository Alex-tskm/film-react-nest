import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { FilmEntity } from '../entities/film.entity';
import { ScheduleEntity } from '../entities/schedule.entity';
import { TypeormFilmsRepository } from '../repository/typeorm-films.repository';
import { FILMS_REPOSITORY } from '../common/constants';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([FilmEntity, ScheduleEntity])],
  controllers: [FilmsController],
  providers: [
    FilmsService,
    {
      provide: FILMS_REPOSITORY,
      useFactory: (
        configService: ConfigService,
        filmRepository: Repository<FilmEntity>,
        scheduleRepository: Repository<ScheduleEntity>,
      ) => {
        const dbDriver = configService.get<string>(
          'DATABASE_DRIVER',
          'postgres',
        );

        if (dbDriver !== 'postgres') {
          throw new Error(
            `Unsupported database driver: ${dbDriver}. Only PostgreSQL is supported`,
          );
        }

        return new TypeormFilmsRepository(filmRepository, scheduleRepository);
      },
      inject: [
        ConfigService,
        getRepositoryToken(FilmEntity),
        getRepositoryToken(ScheduleEntity),
      ],
    },
  ],
  exports: [FilmsService, FILMS_REPOSITORY],
})
export class FilmsModule {}
