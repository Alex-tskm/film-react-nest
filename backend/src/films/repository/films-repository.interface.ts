import { FilmResponseDto, ScheduleDto } from '../dto/films.dto';

// Интерфейс репозитория для работы с данными о фильмах и расписаниях.
// Определяет контракт, которому должна соответствовать любая реализация репозитория.
// Позволяет добиться слабой связанности (loose coupling) и упрощает тестирование
// за счёт возможности подмены реализации (например, на mock‑объекты).
export interface FilmsRepositoryInterface {
  // Асинхронно возвращает список всех фильмов в формате DTO.
  // Результат — массив объектов FilmResponseDto.
  findAll(): Promise<FilmResponseDto[]>;

  // Асинхронно ищет фильм по уникальному идентификатору.
  // Возвращает объект FilmResponseDto, если фильм найден, или null, если не найден.
  // Параметр id: строка, представляющая ID фильма.
  findById(id: string): Promise<FilmResponseDto | null>;

  // Асинхронно ищет конкретный сеанс фильма по ID фильма и ID сеанса.
  // Возвращает объект ScheduleDto, если сеанс найден, или null, если не найден.
  // Параметры:
  // - filmId: строка, ID фильма;
  // - scheduleId: строка, ID сеанса.
  findSchedule(filmId: string, scheduleId: string): Promise<ScheduleDto | null>;

  // Асинхронно возвращает расписание сеансов для указанного фильма.
  // Результат — массив объектов ScheduleDto.
  // Параметр filmId: строка, ID фильма, для которого требуется расписание.
  findAllSchedules(filmId: string): Promise<ScheduleDto[]>;

  // Асинхронно обновляет список занятых мест для конкретного сеанса фильма.
  // Не возвращает данных (Promise<void>), только выполняет операцию обновления.
  // Параметры:
  // - filmId: строка, ID фильма;
  // - scheduleId: строка, ID сеанса;
  // - taken: массив строк, где каждая строка — идентификатор занятого места.
  updateScheduleTaken(
    filmId: string,
    scheduleId: string,
    taken: string[],
  ): Promise<void>;
}
