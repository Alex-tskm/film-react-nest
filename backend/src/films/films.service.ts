import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { FilmsRepositoryInterface } from './repository/films-repository.interface';
import { FilmResponseDto, ScheduleDto } from './dto/films.dto';
import { FILMS_REPOSITORY } from '../common/constants';

// Декоратор @Injectable() отмечает класс как сервис Nest.js,
// который может внедряться в другие компоненты (контроллеры, сервисы)
@Injectable()
export class FilmsService {
  constructor(
    // Внедрение зависимости через токен 'FILMS_REPOSITORY'.
    // Позволяет использовать абстракцию FilmsRepositoryInterface вместо конкретной реализации.
    // Это поддерживает принцип инверсии зависимостей (DIP) и упрощает тестирование.
    @Inject(FILMS_REPOSITORY)
    private filmsRepository: FilmsRepositoryInterface,
  ) {}

  // Возвращает список всех фильмов в формате DTO
  async getAllFilms(): Promise<FilmResponseDto[]> {
    return this.filmsRepository.findAll();
  }

  // Получает фильм по ID. Если фильм не найден, выбрасывает NotFoundException
  async getFilmById(id: string): Promise<FilmResponseDto> {
    const film = await this.filmsRepository.findById(id);
    if (!film) {
      throw new NotFoundException(`Film with id ${id} not found`);
    }
    return film;
  }

  // Получает расписание сеансов для фильма. Сначала проверяет существование фильма
  // (вызывает getFilmById, который выбросит исключение, если фильм не найден).
  // Затем возвращает расписание.
  async getFilmSchedules(filmId: string): Promise<ScheduleDto[]> {
    // Проверяем, что фильм существует (метод сам кинет NotFoundException если нет)
    await this.getFilmById(filmId);
    return this.filmsRepository.findAllSchedules(filmId);
  }

  // Получает конкретный сеанс по ID фильма и ID сеанса. Если сеанс не найден,
  // выбрасывает NotFoundException с детальным сообщением.
  async getFilmSchedule(
    filmId: string,
    scheduleId: string,
  ): Promise<ScheduleDto> {
    const schedule = await this.filmsRepository.findSchedule(
      filmId,
      scheduleId,
    );
    if (!schedule) {
      throw new NotFoundException(
        `Schedule with id ${scheduleId} for film ${filmId} not found`,
      );
    }
    return schedule;
  }

  // Обновляет список занятых мест для конкретного сеанса.
  // Не возвращает данных (Promise<void>), только выполняет операцию.
  async updateTakenSeats(
    filmId: string,
    scheduleId: string,
    taken: string[],
  ): Promise<void> {
    await this.filmsRepository.updateScheduleTaken(filmId, scheduleId, taken);
  }
}
