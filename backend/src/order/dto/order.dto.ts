import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  film: string; // ID фильма

  @IsString()
  session: string; // ID сеанса

  @IsString()
  daytime: string; // время сеанса

  @IsNumber()
  row: number; // ряд

  @IsNumber()
  seat: number; // место

  @IsNumber()
  price: number; // цена
}

export class CreateOrderDto {
  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  tickets: OrderItemDto[];
}

export class OrderResponseItemDto extends OrderItemDto {
  @IsString()
  id: string; // уникальный ID билета/заказа
}

export class OrderResponseDto {
  @IsNumber()
  total: number; // количество билетов

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderResponseItemDto)
  items: OrderResponseItemDto[]; // массив забронированных билетов
}
