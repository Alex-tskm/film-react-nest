import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderResponseDto } from './dto/order.dto';

// Декоратор @Controller задаёт базовый путь для всех маршрутов в этом контроллере
@Controller('order')
export class OrderController {
  // Конструктор класса: внедряем зависимость — сервис обработки заказов
  constructor(private readonly orderService: OrderService) {}

  /**
   * Обработчик POST‑запроса для создания нового заказа
   *
   * @method POST
   * @path /order
   * @description Создаёт заказ на бронирование билетов на основе переданных данных.
   * Использует валидационный пайп для автоматической проверки входных данных.
   *
   * @param {CreateOrderDto} orderData — данные заказа из тела запроса (email, phone, tickets)
   * @returns {Promise<OrderResponseDto>} — асинхронно возвращает объект с результатом бронирования:
   *   - total: общее количество забронированных билетов;
   *   - items: массив забронированных билетов с уникальными ID.
   */
  @Post()
  // Применяем пайп валидации для автоматической проверки данных из тела запроса
  // ValidationPipe проверяет соответствие данных структуре и правилам, заданным в CreateOrderDto
  @UsePipes(new ValidationPipe())
  async createOrder(
    // Извлекаем данные из тела HTTP‑запроса и типизируем их как CreateOrderDto
    @Body() orderData: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Передаём данные в сервис для бизнес‑логики: проверки, бронирования мест и генерации ID
    return this.orderService.createOrder(orderData);
  }
}
