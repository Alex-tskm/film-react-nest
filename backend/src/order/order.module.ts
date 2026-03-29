import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { FilmsModule } from '../films/films.module';
import { Film, FilmSchema } from '../films/schemas/film.schema';

@Module({
  imports: [
    FilmsModule,
    // Подключаем Mongoose для работы с БД
    MongooseModule.forFeature([{ name: Film.name, schema: FilmSchema }]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  // Экспортируем всё, что может понадобиться другим модулям
  exports: [OrderService],
})
export class OrderModule {}
