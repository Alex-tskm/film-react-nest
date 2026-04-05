//TODO описать DTO для запросов к /films
// DTO для фильма в ответе (БЕЗ schedule)
export class FilmResponseDto {
  id: string;
  rating: number;
  director: string;
  tags: string[];
  image: string;
  cover: string;
  title: string;
  about: string;
  description: string;
}

// DTO для элемента расписания в ответе
export class ScheduleDto {
  id: string;
  daytime: string;
  hall: number;
  rows: number;
  seats: number;
  price: number;
  taken: string[];
}

// DTO для ответа со списком фильмов
export class FilmsListResponseDto {
  message: string;
  total: number;
  items: FilmResponseDto[];
}

// DTO для ответа с расписанием
export class ScheduleListResponseDto {
  message: string;
  total: number;
  items: ScheduleDto[];
}

// DTO для параметров запроса
export class FilmParamsDto {
  id: string;
}

export class FilmScheduleParamsDto {
  id: string;
}
