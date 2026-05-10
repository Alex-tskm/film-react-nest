jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { FilmsService } from '../films/films.service';
import {
  CreateOrderDto,
  OrderItemDto,
  OrderResponseDto,
  OrderResponseItemDto
} from './dto/order.dto';
import { FILMS_REPOSITORY } from '../common/constants';
import { FilmsRepositoryInterface } from '../repository/films-repository.interface';
import { ScheduleDto } from '../films/dto/films.dto';

describe('OrderService', () => {
  let service: OrderService;
  let mockFilmsService: jest.Mocked<FilmsService>;
  let mockFilmsRepository: jest.Mocked<FilmsRepositoryInterface>;

  const mockSchedule: ScheduleDto = {
    id: 'session1',
    daytime: '2024-01-01T19:00:00',
    hall: 1,
    rows: 10,
    seats: 20,
    price: 500,
    taken: [],
  };

  beforeEach(async () => {
    mockFilmsService = {
      getAllFilms: jest.fn().mockResolvedValue([] as any[]),
      getFilmById: jest.fn().mockResolvedValue({} as any),
      getFilmSchedules: jest.fn().mockResolvedValue([] as ScheduleDto[]),
      getFilmSchedule: jest.fn(),
      updateTakenSeats: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<FilmsService>;

    mockFilmsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findAllSchedules: jest.fn(),
      findSchedule: jest.fn(),
      updateScheduleTaken: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<FilmsRepositoryInterface>;


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: FilmsService,
          useValue: mockFilmsService,
        },
        {
          provide: FILMS_REPOSITORY,
          useValue: mockFilmsRepository,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
            price: 500
          } as OrderItemDto,
        ],
      };

      mockFilmsService.getFilmSchedule.mockResolvedValue({
        ...mockSchedule,
        price: 500
      });

      console.log('Mock schedule type:', typeof mockSchedule.price, 'value:', mockSchedule.price);
      console.log('Input ticket type:', typeof createOrderDto.tickets[0].price, 'value:', createOrderDto.tickets[0].price);

      const result = await service.createOrder(createOrderDto);

      // Убираем проверку на экземпляр и проверяем структуру объекта
      expect(result).toEqual({
        total: 1,
        items: [
          expect.objectContaining({
            id: expect.any(String),
            film: 'film1',
            session: 'session1',
            daytime: '2024-01-01T19:00:00',
            row: 5,
            seat: 10,
            price: 500
          })
        ]
      });

      expect(mockFilmsService.getFilmSchedule).toHaveBeenCalledWith('film1', 'session1');
      expect(mockFilmsRepository.updateScheduleTaken).toHaveBeenCalledWith(
        'film1',
        'session1',
        ['5:10']
      );
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
            price: 600
          } as OrderItemDto,
        ],
      };

      mockFilmsService.getFilmSchedule.mockResolvedValue({
        ...mockSchedule,
        price: 500
      });

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        'Price mismatch for film film1, session session1'
      );

      expect(mockFilmsService.getFilmSchedule).toHaveBeenCalledWith('film1', 'session1');
    });
  });
});
