import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Схема Mongoose для элемента расписания сеанса фильма.
 * Описывает структуру данных для одного сеанса (время, зал, места и т. д.).
 */
@Schema({ timestamps: false }) // Отключаем автоматические createdAt/updatedAt — они будут в основной схеме Film
export class ScheduleItem {
  @Prop({
    required: true,
    unique: true, // Гарантирует уникальность ID сеанса во всей системе
    index: true, // Индекс для быстрого поиска сеанса по ID
  })
  id: string; // Уникальный идентификатор сеанса

  @Prop({
    required: true,
    type: Date, // Тип Date позволяет использовать операторы сравнения дат в запросах
  })
  daytime: Date; // Дата и время сеанса в формате ISO (например, '2024-01-15T19:00:00')

  @Prop({ required: true })
  hall: string; // Название или номер зала (например, 'Зал 1')

  @Prop({
    required: true,
    min: 1, // Минимум 1 ряд в зале
  })
  rows: number; // Количество рядов в зале

  @Prop({
    required: true,
    min: 1, // Минимум 1 место в зале
  })
  seats: number; // Общее количество мест в зале

  @Prop({
    type: [String],
    default: [],
    validate: [
      (v: string[]) => v.length <= 1000,
      'Список занятых мест не может содержать более 1000 элементов', // Защита от переполнения
    ],
  })
  taken: string[]; // Массив идентификаторов занятых мест (например, ['A1', 'A2'])

  @Prop({
    required: true,
    min: 0, // Цена не может быть отрицательной
  })
  price: number; // Стоимость билета в рублях
}

/**
 * Основная схема Mongoose для фильма.
 * Описывает полную структуру документа фильма в MongoDB, включая вложенное расписание сеансов.
 */
@Schema({
  timestamps: true, // Автоматически добавляет поля createdAt и updatedAt
  versionKey: false, // Убираем поле __v (версия документа) для экономии места
})
export class Film extends Document {
  @Prop({
    required: true,
    unique: true, // Гарантирует уникальность ID фильма во всей системе
    index: true, // Индекс для быстрого поиска фильма по ID
    match: [
      /^[a-zA-Z0-9_-]+$/,
      'ID фильма должен содержать только буквы, цифры, дефисы и подчёркивания',
    ], // Валидация формата ID
  })
  id: string; // Уникальный идентификатор фильма

  @Prop({
    required: true,
    min: 0, // Рейтинг не может быть отрицательным
    max: 10, // Максимальный рейтинг — 10 баллов
    type: Number, // Явное указание типа
  })
  rating: number; // Рейтинг фильма (например, 8.7)

  @Prop({ required: true })
  director: string; // Имя режиссёра

  @Prop({
    required: true,
    type: [String],
    validate: [
      (v: string[]) => v.length >= 1 && v.length <= 5,
      'Фильм должен иметь от 1 до 5 тегов', // Ограничение количества тегов
    ],
  })
  tags: string[]; // Массив тегов/жанров (например, ['фантастика', 'боевик'])

  @Prop({ required: true })
  image: string; // URL миниатюры фильма

  @Prop({ required: true })
  cover: string; // URL обложки фильма

  @Prop({ required: true })
  title: string; // Название фильма

  @Prop({ required: true })
  about: string; // Краткое описание/лозунг фильма

  @Prop({ required: true })
  description: string; // Полное описание фильма

  @Prop({
    type: [ScheduleItem],
    default: [],
    validate: [
      (v: ScheduleItem[]) => v.length <= 100,
      'Расписание не может содержать более 100 сеансов', // Предотвращает бесконтростный рост документа
    ],
  })
  schedule: ScheduleItem[]; // Массив сеансов фильма
}

// Типы для улучшенной типобезопасности в сервисах и контроллерах
export type FilmDocument = Film & Document;
export type ScheduleItemDocument = ScheduleItem & Document;

// Создаёт схему Mongoose на основе класса Film
export const FilmSchema = SchemaFactory.createForClass(Film);

// Индексы для оптимизации частых запросов
FilmSchema.index(
  { id: 1 },
  { name: 'film_id_index' }, // Индекс для быстрого поиска фильмов по ID (частый запрос)
);

FilmSchema.index(
  { 'schedule.id': 1 },
  { name: 'schedule_id_index' }, // Индекс для поиска конкретных сеансов внутри расписания фильма
);

// Составной индекс для частых запросов по фильму и сеансу
FilmSchema.index(
  { id: 1, 'schedule.id': 1 },
  {
    name: 'film_schedule_composite_index',
    unique: true, // Гарантирует, что у фильма не будет двух сеансов с одинаковым ID
  },
);
