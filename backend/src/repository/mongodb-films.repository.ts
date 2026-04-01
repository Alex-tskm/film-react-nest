import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Film } from '../films/schemas/film.schema';
import { FilmsRepositoryInterface } from './films-repository.interface';
import {
  FilmResponseDto,
  ScheduleDto
} from '../films/dto/films.dto';

@Injectable()
export class MongodbFilmsRepository implements FilmsRepositoryInterface {
  private readonly logger = new Logger(MongodbFilmsRepository.name);

  constructor(@InjectModel(Film.name) private filmModel: Model<Film>) {}

  /**
   * Получает все фильмы из БД и возвращает их в формате FilmsListResponseDto.
   * Включает общее количество фильмов и массив фильмов в формате DTO.
   */
  async findAll(): Promise<FilmResponseDto[]> {
    try {
      const rawFilms = await this.filmModel.find().exec();
      this.logger.log(`RAW FILMS COUNT: ${rawFilms.length}`);
      this.logger.log(`RAW FILMS DATA: ${JSON.stringify(rawFilms, null, 2)}`);

      const dtoFilms = rawFilms.map((film) => this.mapToFilmDto(film));
      this.logger.log(`DTO FILMS COUNT: ${dtoFilms.length}`);
      this.logger.log(`DTO FILMS DATA: ${JSON.stringify(dtoFilms, null, 2)}`);

      return dtoFilms;
    } catch (error) {
      this.logger.error('Ошибка при получении всех фильмов', error.stack);
      throw error;
    }
  }

  /**
   * Ищет фильм по ID. Если найден — преобразует в DTO, иначе возвращает null.
   * @param id ID фильма для поиска
   */
  async findById(id: string): Promise<FilmResponseDto | null> {
    try {
      if (!id) {
        this.logger.warn('Передан пустой ID фильма для поиска');
        return null;
      }

      const film = await this.filmModel.findOne({ id }).exec();

      if (!film) {
        this.logger.warn(`Фильм с ID ${id} не найден`);
        return null;
      }

      this.logger.log(`Успешно найден фильм с ID ${id}`);
      return this.mapToFilmDto(film);
    } catch (error) {
      this.logger.error(`Ошибка при поиске фильма с ID ${id}`, error.stack);
      throw error;
    }
  }

  /**
   * Находит конкретный сеанс фильма по ID фильма и ID сеанса.
   * Использует проекцию { 'schedule.$': 1 } для возврата только совпадающего элемента массива schedule.
   * @param filmId ID фильма
   * @param scheduleId ID сеанса
   */
  async findSchedule(
    filmId: string,
    scheduleId: string,
  ): Promise<ScheduleDto | null> {
    try {
      if (!filmId || !scheduleId) {
        this.logger.warn(
          'Переданы пустые ID фильма или сеанса для поиска расписания',
        );
        return null;
      }

      const film = await this.filmModel
        .findOne(
          {
            id: filmId,
            'schedule.id': scheduleId,
          },
          { 'schedule.$': 1 },
        )
        .exec();

      if (!film || !film.schedule || film.schedule.length === 0) {
        this.logger.warn(
          `Расписание с ID ${scheduleId} для фильма ${filmId} не найдено`,
        );
        return null;
      }

      // Безопасное преобразование типа: сначала к unknown, затем к ScheduleDto
      const schedule = film.schedule[0] as unknown as ScheduleDto;

      this.logger.log(
        `Успешно найдено расписание с ID ${scheduleId} для фильма ${filmId}`,
      );
      return this.mapToScheduleDto(schedule);
    } catch (error) {
      this.logger.error(
        `Ошибка при поиске расписания с ID ${scheduleId} для фильма ${filmId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Получает все сеансы для указанного фильма.
   * Если фильм или расписание не найдены, возвращает объект с total: 0 и пустым массивом items.
   * @param filmId ID фильма для получения расписания
   */
  async findAllSchedules(filmId: string): Promise<ScheduleDto[]> {
    try {
      if (!filmId) {
        this.logger.warn('Передан пустой ID фильма для получения расписаний');
        return [];
      }

      const film = await this.filmModel.findOne({ id: filmId }).exec();

      if (!film || !film.schedule) {
        this.logger.warn(`Для фильма с ID ${filmId} расписания не найдены`);
        return [];
      }

      const schedules = film.schedule as unknown as ScheduleDto[];

      // Конвертируем все даты в string
      const convertedSchedules = schedules.map((schedule) => {
        const daytime =
          (schedule.daytime as unknown) instanceof Date
            ? (schedule.daytime as unknown as Date).toISOString()
            : schedule.daytime;

        return {
          ...schedule,
          daytime,
        };
      });

      this.logger.log(
        `Найдено ${convertedSchedules.length} расписаний для фильма с ID ${filmId}`,
      );

      return convertedSchedules.map((schedule) =>
        this.mapToScheduleDto(schedule),
      );
    } catch (error) {
      this.logger.error(
        `Ошибка при получении расписаний для фильма с ID ${filmId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Обновляет список занятых мест для конкретного сеанса.
   * Использует оператор $set и позиционный оператор $ для обновления элемента массива.
   * @param filmId ID фильма
   * @param scheduleId ID сеанса
   * @param taken массив идентификаторов занятых мест
   */
  async updateScheduleTaken(
    filmId: string,
    scheduleId: string,
    taken: string[],
  ): Promise<void> {
    try {
      if (!filmId || !scheduleId || !Array.isArray(taken)) {
        this.logger.warn(
          'Некорректные параметры переданы для обновления занятых мест',
        );
        throw new Error('Некорректные параметры для обновления занятых мест');
      }

      const result = await this.filmModel
        .updateOne(
          {
            id: filmId,
            'schedule.id': scheduleId,
          },
          {
            $set: { 'schedule.$.taken': taken },
          },
        )
        .exec();

      if (result.modifiedCount === 0) {
        this.logger.warn(
          `Расписание не обновлено для фильма ${filmId}, сеанс ${scheduleId}`,
        );
      } else {
        this.logger.log(
          `Успешно обновлены занятые места для фильма ${filmId}, сеанс ${scheduleId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Ошибка при обновлении занятых мест для фильма ${filmId}, сеанс ${scheduleId}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Преобразует документ Mongoose Film в DTO FilmResponseDto.
   * @param film документ фильма из MongoDB
   * @returns FilmResponseDto объект DTO фильма
   */
  private mapToFilmDto(film: Film): FilmResponseDto {
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
    };
  }

  /**
   * Преобразует элемент расписания (из массива schedule документа Film) в DTO ScheduleDto.
   * @param schedule документ расписания из MongoDB
   * @returns ScheduleDto объект DTO расписания
   */
  private mapToScheduleDto(schedule: ScheduleDto): ScheduleDto {
    // Гарантируем, что daytime — строка
    const daytime =
      (schedule.daytime as unknown) instanceof Date
        ? (schedule.daytime as unknown as Date).toISOString()
        : schedule.daytime;

    return {
      id: schedule.id,
      daytime: schedule.daytime,
      hall: schedule.hall,
      rows: schedule.rows,
      seats: schedule.seats,
      price: schedule.price,
      taken: schedule.taken || [],
    };
  }
}
