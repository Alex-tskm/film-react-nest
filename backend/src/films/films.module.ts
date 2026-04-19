import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { FilmEntity } from '../entities/film.entity';
import { ScheduleEntity } from '../entities/schedule.entity';
import { TypeormFilmsRepository } from '../repository/typeorm-films.repository';
import { FILMS_REPOSITORY } from '../common/constants';

@Module({
  imports: [TypeOrmModule.forFeature([FilmEntity, ScheduleEntity])],
  controllers: [FilmsController],
  providers: [
    FilmsService,
    {
      provide: FILMS_REPOSITORY,
      useClass: TypeormFilmsRepository,
    },
  ],
  exports: [FilmsService, FILMS_REPOSITORY],
})
export class FilmsModule {}
