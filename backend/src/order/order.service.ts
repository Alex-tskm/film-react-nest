import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { FilmsService } from '../films/films.service';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Film } from '../films/schemas/film.schema';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderResponseItemDto,
  OrderItemDto,
} from './dto/order.dto';
import { ScheduleDto } from '../films/dto/films.dto';

// Интерфейс для типизации ошибок — гарантирует доступ к полям message и stack
interface ErrorWithMessage {
  message: string;
  stack?: string;
}

// Проверяет, соответствует ли ошибка интерфейсу ErrorWithMessage
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Преобразует любую ошибку в объект с полем message
function toErrorWithMessage(err: unknown): ErrorWithMessage {
  if (isErrorWithMessage(err)) return err;
  try {
    return new Error(JSON.stringify(err));
  } catch {
    // fallback: преобразуем в строку, если JSON.stringify не сработал
    return new Error(String(err));
  }
}

// Извлекает текстовое сообщение из ошибки любого типа
function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

@Injectable()
export class OrderService {
  // Логгер для отслеживания операций и ошибок
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private filmsService: FilmsService,
    @InjectModel(Film.name) private filmModel: Model<Film>,
  ) {}

  /**
   * Создаёт заказ на бронирование билетов
   * @param orderData Данные заказа (email, phone, массив билетов)
   * @returns Promise<OrderResponseDto> Объект с общим количеством билетов и массивом забронированных билетов с уникальными ID
   */
  async createOrder(orderData: CreateOrderDto): Promise<OrderResponseDto> {
    const { email, phone, tickets } = orderData;
    const responseItems: OrderResponseItemDto[] = []; // Массив для хранения созданных билетов с уникальными ID
    const sessionUpdates: {
      filmId: string;
      sessionId: string;
      seats: string[];
    }[] = [];

    let seatsToBookCount = 0;

    try {
      // Группируем билеты по комбинации «фильм + сеанс» для пакетной обработки
      const groupedBySession = this.groupBySession(tickets);

      for (const [sessionKey, items] of Object.entries(groupedBySession)) {
        const [filmId, sessionId] = sessionKey.split('|');

        try {
          // Получаем данные о сеансе из сервиса фильмов
          const schedule = await this.filmsService.getFilmSchedule(filmId, sessionId);

          // Проверяем соответствие цены для всех билетов в группе
          this.validateScheduleData(items, schedule);

          // Формируем массив строк вида «ряд:место» для бронирования
          const seatsToBook = items.map((item) => `${item.row}:${item.seat}`);
          
          // Сохраняем длину массива в переменную, объявленную вне try
          seatsToBookCount = seatsToBook.length;

          // Проверяем доступность и бронируем места в БД
          await this.validateAndBookSeats(filmId, sessionId, seatsToBook, schedule);

          // Создаём объекты билетов с уникальными UUID
          for (const item of items) {
            responseItems.push({
              ...item,
              id: uuidv4(), // генерируем уникальный ID для каждого билета
            });
          }

          this.logger.log(`Successfully booked ${seatsToBook.length} seats for film ${filmId}, session ${sessionId}`);
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          this.logger.error(
            `Booking failed for film ${filmId}, session ${sessionId}: ${errorMessage}`,
            {
              error: errorMessage,
              stack: isErrorWithMessage(error) ? error.stack : undefined,
              filmId,
              sessionId,
              seatsToBookCount,
            }
          );
          throw error;
        }
      }

      // Возвращаем итоговый объект заказа
      return {
        total: responseItems.length, // общее количество забронированных билетов
        items: responseItems, // массив билетов с уникальными ID
      };
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error('Order creation failed', {
        error: errorMessage,
        stack: isErrorWithMessage(error) ? error.stack : undefined,
        inputData: {
          email,
          phone,
          ticketsCount: tickets.length,
        },
      });
      throw error;
    }
  }

  /**
   * Проверяет соответствие цены в заказе данным из БД
   * @param items Массив билетов в заказе
   * @param schedule Данные о сеансе из БД
   */
  private validateScheduleData(items: OrderItemDto[], schedule: ScheduleDto) {
    for (const item of items) {
      if (schedule.price !== item.price) {
        throw new BadRequestException(
          `Price mismatch for film ${item.film}, session ${item.session}`
        );
      }
    }
  }

  /**
   * Проверяет валидность и доступность мест, бронирует их в БД
   * @param filmId ID фильма
   * @param sessionId ID сеанса
   * @param seatsToBook Массив строк вида «ряд:место»
   * @param schedule Данные о сеансе (включая схему зала)
   * @param session Текущая MongoDB-сессия (теперь не используется)
   */
  private async validateAndBookSeats(
    filmId: string,
    sessionId: string,
    seatsToBook: string[],
    schedule: ScheduleDto,    
  ) {    

    this.logger.debug('Starting seat validation and booking process', {
      filmId,
      sessionId,
      seatsToBookCount: seatsToBook.length,
      seatsToBook,
      scheduleInfo: {
        rows: schedule.rows,
        seats: schedule.seats,
        takenCount: schedule.taken?.length || 0,
        takenSeats: schedule.taken || [],
      },
    });

    // Проверка валидности мест по отдельности
    for (const seat of seatsToBook) {
      this.logger.debug('Validating individual seat', { seat });

      if (!this.isValidSeat(seat, schedule.rows, schedule.seats)) {
        this.logger.error('Invalid seat detected', { seat, filmId, sessionId });
        throw new BadRequestException(`Invalid seat: ${seat}`);
      }

      this.logger.debug('Seat passed validation', { seat });
    }

    this.logger.debug('All seats passed initial validation, proceeding to DB check');

    // Подготовка данных для MongoDB-запроса
    const query = {
      id: filmId,
      'schedule.id': sessionId,
      'schedule.taken': { $nin: seatsToBook },
    };

    const update = {
      $addToSet: {
        'schedule.$.taken': { $each: seatsToBook },
      },
    };

    this.logger.debug('MongoDB query prepared', {
      query,
      update,
      options: { hasSession: false }, // явно указываем, что сессии нет
    });

    try {
      // Выполнение MongoDB-запроса (без сессии транзакции)
      this.logger.debug('Executing MongoDB update query');
      const result = await this.filmModel.updateOne(query, update).exec();

      this.logger.debug('MongoDB query executed', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
      });

      // Проверка результата обновления
      if (result.modifiedCount === 0) {
        // Дополнительная диагностика: проверяем, какие места уже заняты
        const filmDoc = await this.filmModel
          .findOne({ id: filmId, 'schedule.id': sessionId }, { 'schedule.$': 1 })
          .exec();

        const currentTaken = filmDoc?.schedule?.[0]?.taken || [];
        const conflictingSeats = seatsToBook.filter((seat) =>
          currentTaken.includes(seat)
        );

        this.logger.warn('No seats were booked', {
          reason: 'No documents modified',          
          currentTakenSeats: currentTaken,
          conflictingSeats,
          seatsToBook,
        });

        throw new BadRequestException(
          `Some seats are already taken or invalid. Conflicting seats: ${conflictingSeats.join(', ')}`
        );
      }

      this.logger.log('Successfully booked seats', {
        bookedSeatsCount: seatsToBook.length,
        bookedSeats: seatsToBook,
        filmId,
        sessionId,
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error('Error during seat booking process', {
        error: errorMessage,
        stack: isErrorWithMessage(error) ? error.stack : undefined,
        filmId,
        sessionId,
        seatsToBook,
        query,
        update,
      });
      throw error;
    }
  }

  /**
   * Группирует билеты по комбинации «фильм + сеанс» для пакетной обработки
   * @param items Массив всех билетов в заказе
   * @returns Record<string, OrderItemDto[]> Объект, где ключ — «filmId|sessionId», значение — массив билетов
   */
  private groupBySession(
    items: OrderItemDto[],
  ): Record<string, OrderItemDto[]> {
    const grouped: Record<string, OrderItemDto[]> = {};
    for (const item of items) {
      const key = `${item.film}|${item.session}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    }
    return grouped;
  }

  /**
   * Проверяет, что место находится в пределах схемы зала (1 ≤ ряд ≤ totalRows, 1 ≤ место ≤ totalSeats)
   * @param seat Строка вида «ряд:место» (например, «5:12»)
   * @param totalRows Общее количество рядов в зале
   * @param totalSeats Общее количество мест в ряду
   * @returns boolean true, если место валидно
   */
  private isValidSeat(
    seat: string,
    totalRows: number,
    totalSeats: number,
  ): boolean {
    const [rowStr, seatStr] = seat.split(':');
    const row = parseInt(rowStr, 10);
    const seatNum = parseInt(seatStr, 10);

    if (isNaN(row) || isNaN(seatNum)) return false;
    if (row < 1 || row > totalRows) return false;
    if (seatNum < 1 || seatNum > totalSeats) return false;

    return true;
  }
}
