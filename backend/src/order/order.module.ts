import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { FilmsModule } from '../films/films.module';
import { FilmEntity } from '../entities/film.entity';
import { ScheduleEntity } from '../entities/schedule.entity';

@Module({
  imports: [
    FilmsModule,
    // Подключаем TypeORM вместо Mongoose
    TypeOrmModule.forFeature([FilmEntity, ScheduleEntity]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  // Экспортируем всё, что может понадобиться другим модулям
  exports: [OrderService],
})
export class OrderModule {}
