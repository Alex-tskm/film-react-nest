jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { FilmsService } from '../films/films.service';
import { Model } from 'mongoose';
import { Film } from '../films/schemas/film.schema';
import { CreateOrderDto } from './dto/order.dto';

describe('OrderService', () => {
  let service: OrderService;
  let filmsService: FilmsService;
  let filmModel: Model<Film>;

  const mockFilmsService = {
    getFilmSchedule: jest.fn(),
  };

  const mockFilmModel = {
    updateOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    findOne: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: FilmsService,
          useValue: mockFilmsService,
        },
        {
          provide: 'FilmModel',
          useValue: mockFilmModel,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    filmsService = module.get<FilmsService>(FilmsService);
    filmModel = module.get<Model<Film>>('FilmModel');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should successfully create order with valid data', async () => {
      const createOrderDto: CreateOrderDto = {
        email: 'test@example.com',
        phone: '+79991234567',
        tickets: [
          {
            film: 'film1',
            session: 'session1',
            daytime: '2024-01-01T19:00:00',
            row: 5,
            seat: 10,
            price: 500,
          },
        ],
      };

      const mockSchedule = {
        price: 500,
        rows: 10,
        seats: 20,
        taken: [],
      };

      mockFilmsService.getFilmSchedule.mockResolvedValue(mockSchedule);
      mockFilmModel.exec.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });

      const result = await service.createOrder(createOrderDto);

      expect(result.total).toBe(1);
      expect(result.items[0].id).toBeDefined();
      expect(mockFilmsService.getFilmSchedule).toHaveBeenCalledWith('film1', 'session1');
    });

    it('should throw BadRequestException when price mismatch', async () => {
      const createOrderDto: CreateOrderDto = {
        email: 'test@example.com',
        phone: '+79991234567',
        tickets: [
          {
            film: 'film1',
            session: 'session1',
            daytime: '2024-01-01T19:00:00',
            row: 5,
            seat: 10,
            price: 600, // цена не совпадает
          },
        ],
      };

      const mockSchedule = {
        price: 500, // цена не совпадает с DTO
        rows: 10,
        seats: 20,
        taken: [],
      };

      mockFilmsService.getFilmSchedule.mockResolvedValue(mockSchedule);

      await expect(service.createOrder(createOrderDto))
        .rejects
        .toThrow('Price mismatch for film film1, session session1');
    });
  });
});
