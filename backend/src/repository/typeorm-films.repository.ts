import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { FilmsRepositoryInterface } from './films-repository.interface';
import { FilmResponseDto, ScheduleDto } from '../films/dto/films.dto';
import { FilmEntity } from '../entities/film.entity';
import { ScheduleEntity } from '../entities/schedule.entity';

@Injectable()
export class TypeormFilmsRepository implements FilmsRepositoryInterface {
  private readonly logger = new Logger(TypeormFilmsRepository.name);

  constructor(
    @InjectRepository(FilmEntity)
    private filmRepository: Repository<FilmEntity>,
    @InjectRepository(ScheduleEntity)
    private scheduleRepository: Repository<ScheduleEntity>,
  ) {}

  async findAll(): Promise<FilmResponseDto[]> {
    try {
      const films = await this.filmRepository.find({
        relations: ['schedule'],
      });

      this.logger.log(`Found ${films.length} films`);
      return films.map((film) => this.mapToFilmDto(film));
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error fetching all films', stack);
      throw error;
    }
  }

  async findById(id: string): Promise<FilmResponseDto | null> {
    try {
      if (!id) {
        this.logger.warn('Empty film ID provided for search');
        return null;
      }

      const film = await this.filmRepository.findOne({
        where: { id },
        relations: ['schedule'],
      });

      if (!film) {
        this.logger.warn(`Film with ID ${id} not found`);
        return null;
      }

      this.logger.log(`Successfully found film with ID ${id}`);
      return this.mapToFilmDto(film);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error finding film with ID ${id}`, stack);
      throw error;
    }
  }

  async findSchedule(
    filmId: string,
    scheduleId: string,
  ): Promise<ScheduleDto | null> {
    try {
      if (!filmId || !scheduleId) {
        this.logger.warn('Empty IDs provided for schedule search');
        return null;
      }

      const schedule = await this.scheduleRepository.findOne({
        where: {
          id: scheduleId,
          film: { id: filmId } as FindOptionsWhere<FilmEntity>,
        },
      });

      if (!schedule) {
        this.logger.warn(
          `Schedule with ID ${scheduleId} for film ${filmId} not found`,
        );
        return null;
      }

      this.logger.log(
        `Successfully found schedule with ID ${scheduleId} for film ${filmId}`,
      );
      return this.mapToScheduleDto(schedule);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error finding schedule with ID ${scheduleId} for film ${filmId}`,
        stack,
      );
      throw error;
    }
  }

  async findAllSchedules(filmId: string): Promise<ScheduleDto[]> {
    try {
      if (!filmId) {
        this.logger.warn('Empty film ID provided for schedules retrieval');
        return [];
      }

      const schedules = await this.scheduleRepository.find({
        where: { film: { id: filmId } as FindOptionsWhere<FilmEntity> },
      });

      this.logger.log(
        `Found ${schedules.length} schedules for film with ID ${filmId}`,
      );

      return schedules.map((schedule) => this.mapToScheduleDto(schedule));
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error retrieving schedules for film with ID ${filmId}`,
        stack,
      );
      throw error;
    }
  }

  async updateScheduleTaken(
    filmId: string,
    scheduleId: string,
    taken: string[],
  ): Promise<void> {
    try {
      if (
        !filmId ||
        !scheduleId ||
        !Array.isArray(taken) ||
        taken.length === 0
      ) {
        this.logger.warn(
          'Invalid parameters provided for updating taken seats',
        );
        throw new Error('Invalid parameters for updating taken seats');
      }

      // Валидация формата мест
      this.validateSeatFormat(taken);

      const queryRunner =
        this.scheduleRepository.manager.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const currentSchedule = await queryRunner.manager
          .getRepository(ScheduleEntity)
          .findOne({
            where: {
              id: scheduleId,
              film: { id: filmId } as FindOptionsWhere<FilmEntity>,
            },
          });

        if (!currentSchedule) {
          throw new NotFoundException(
            `Schedule with ID ${scheduleId} for film ${filmId} not found`,
          );
        }

        // Парсим текущее поле `taken` из строки в массив
        const currentTaken: string[] = currentSchedule.taken
          ? currentSchedule.taken
              .split(',')
              .filter((seat) => seat.trim() !== '')
          : [];

        // Проверяем доступность мест
        const alreadyTaken = taken.filter((seat) =>
          currentTaken.includes(seat),
        );
        if (alreadyTaken.length > 0) {
          await queryRunner.rollbackTransaction();
          throw new BadRequestException(
            `Some seats are already taken: ${alreadyTaken.join(', ')}`,
          );
        }

        // Объединяем старые и новые места, удаляем дубликаты
        const updatedTakenArray = [...new Set([...currentTaken, ...taken])];
        const updatedTakenString = updatedTakenArray.join(',');

        // Сохраняем изменения в рамках транзакции
        await queryRunner.manager
          .getRepository(ScheduleEntity)
          .update({ id: scheduleId }, { taken: updatedTakenString });

        await queryRunner.commitTransaction();
        this.logger.log(
          `Successfully updated taken seats for film ${filmId}, session ${scheduleId}`,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error updating taken seats for film ${filmId}, session ${scheduleId}`,
        stack,
      );
      throw error;
    }
  }

  private validateSeatFormat(seats: string[]): void {
    const seatRegex = /^\d+:\d+$/;
    const invalidSeats = seats.filter((seat) => !seatRegex.test(seat.trim()));
    if (invalidSeats.length > 0) {
      throw new BadRequestException(
        `Invalid seat format: ${invalidSeats.join(', ')}. Expected format: "row:seat" (e.g., "5:12")`,
      );
    }
  }

  private mapToFilmDto(film: FilmEntity): FilmResponseDto {
    this.logger.log(`Mapping film with ID: ${film.id}, title: ${film.title}`);

    return {
      id: film.id,
      rating: film.rating,
      director: film.director,
      tags: film.tags,
      image: film.image,
      cover: film.cover,
      title: film.title,
      about: film.about,
      description: film.description,
      schedule: film.schedule
        ? film.schedule.map((s) => this.mapToScheduleDto(s))
        : [],
    };
  }

  private mapToScheduleDto(schedule: ScheduleEntity): ScheduleDto {
    return {
      id: schedule.id,
      daytime: schedule.daytime.toString(),
      hall: schedule.hall,
      rows: schedule.rows,
      seats: schedule.seats,
      price: schedule.price,
      taken: schedule.taken
        ? schedule.taken.split(',').filter((seat) => seat.trim() !== '')
        : [],
    };
  }
}
