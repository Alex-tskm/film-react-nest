import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { FilmsService } from './films.service';
import {
  FilmsListResponseDto,
  ScheduleListResponseDto,
  FilmResponseDto,
} from './dto/films.dto';

// Декоратор @Controller задаёт базовый путь для всех эндпоинтов контроллера
// Все маршруты этого контроллера будут начинаться с '/films'
@Controller('films')
export class FilmsController {
  // Конструктор класса — внедряет зависимость FilmsService через DI‑контейнер NestJS
  // private readonly гарантирует, что свойство доступно только внутри класса и не может быть изменено
  constructor(private readonly filmsService: FilmsService) {}

  // GET /films — получает список всех фильмов
  @Get()
  async getFilms(): Promise<FilmsListResponseDto> {
    // Вызываем метод сервиса для получения всех фильмов из БД/репозитория
    const films = await this.filmsService.getAllFilms();

    // Формируем структурированный ответ согласно DTO FilmsListResponseDto
    return {
      // Сообщение с описанием эндпоинта (для удобства отладки и документации)
      message: 'GET /api/afisha/films/ — список фильмов',
      // Общее количество фильмов в ответе
      total: films.length,
      // Массив фильмов — непосредственно данные
      items: films,
    };
  }

  // GET /films/:id — получает фильм по ID
  // @Param('id') — декоратор NestJS для извлечения параметра из URL
  // Например, для URL /films/123 параметр id будет равен '123'
  @Get(':id')
  async getFilmById(@Param('id') id: string): Promise<FilmResponseDto | null> {
    // Получаем фильм по ID через сервис
    const film = await this.filmsService.getFilmById(id);

    // Проверяем, найден ли фильм
    if (!film) {
      // Если фильм не найден, выбрасываем исключение NotFoundException
      // NestJS автоматически вернёт HTTP‑статус 404 Not Found
      throw new NotFoundException(`Фильм с ID ${id} не найден`);
    }

    // Возвращаем найденный фильм согласно DTO FilmResponseDto
    return film;
  }

  // GET /films/:id/schedule — получает расписание сеансов для фильма по ID
  @Get(':id/schedule')
  async getFilmSchedule(
    @Param('id') id: string,
  ): Promise<ScheduleListResponseDto> {
    // Получаем расписание сеансов для фильма через сервис
    const schedule = await this.filmsService.getFilmSchedules(id);

    // Формируем структурированный ответ согласно DTO ScheduleListResponseDto
    return {
      // Сообщение с описанием эндпоинта и указанием ID фильма
      message: `GET /api/afisha/films/${id}/schedule — расписание сеансов для фильма с ID ${id}`,
      // Общее количество сеансов в расписании
      total: schedule.length,
      // Массив сеансов — непосредственно данные расписания
      items: schedule,
    };
  }
}
