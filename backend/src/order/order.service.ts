import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { FilmsService } from '../films/films.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderResponseItemDto,
  OrderItemDto,
} from './dto/order.dto';
import { ScheduleDto } from '../films/dto/films.dto';
import { FILMS_REPOSITORY } from '../common/constants';
import { FilmsRepositoryInterface } from '../repository/films-repository.interface';

// Интерфейс для типизации ошибок
interface ErrorWithMessage {
  message: string;
  stack?: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(err: unknown): ErrorWithMessage {
  if (isErrorWithMessage(err)) return err;
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
}

function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private filmsService: FilmsService,
    @Inject(FILMS_REPOSITORY)
    private filmsRepository: FilmsRepositoryInterface,
  ) {}

  async createOrder(orderData: CreateOrderDto): Promise<OrderResponseDto> {
    const { email, phone, tickets } = orderData;
    const responseItems: OrderResponseItemDto[] = [];

    try {
      const groupedBySession = this.groupBySession(tickets);

      for (const [sessionKey, items] of Object.entries(groupedBySession)) {
        const [filmId, sessionId] = sessionKey.split('|');

        try {
          const schedule = await this.filmsService.getFilmSchedule(
            filmId,
            sessionId,
          );
          this.validateScheduleData(items, schedule);

          // Формируем массив строк вида «ряд:место»
          const seatsToBook = items.map((item) => `${item.row}:${item.seat}`);

          // Бронируем места через репозиторий (с транзакциями и валидацией)
          await this.filmsRepository.updateScheduleTaken(
            filmId,
            sessionId,
            seatsToBook,
          );

          for (const item of items) {
            responseItems.push({
              ...item,
              id: uuidv4(),
            });
          }

          this.logger.log(
            `Successfully booked ${seatsToBook.length} seats for film ${filmId}, session ${sessionId}`,
          );
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error);
          this.logger.error(
            `Booking failed for film ${filmId}, session ${sessionId}: ${errorMessage}`,
            {
              error: errorMessage,
              stack: isErrorWithMessage(error) ? error.stack : undefined,
              filmId,
              sessionId,
              seatsToBookCount: items.length,
            },
          );
          throw error;
        }
      }

      return {
        total: responseItems.length,
        items: responseItems,
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

  private validateScheduleData(items: OrderItemDto[], schedule: ScheduleDto) {
    for (const item of items) {
      if (schedule.price !== item.price) {
        throw new BadRequestException(
          `Price mismatch for film ${item.film}, session ${item.session}`,
        );
      }
    }
  }

  /**
   * Группирует билеты по комбинации «фильм + сеанс» для пакетной обработки
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
   * Проверяет, что место находится в пределах схемы зала
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
