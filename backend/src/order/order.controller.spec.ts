jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));
import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/order.dto';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: OrderService;

  const mockOrderService = {
    createOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should call orderService.createOrder with correct data', async () => {
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

      const expectedResponse = {
        total: 1,
        items: [
          {
            ...createOrderDto.tickets[0],
            id: 'generated-uuid',
          },
        ],
      };

      mockOrderService.createOrder.mockResolvedValue(expectedResponse);

      const result = await controller.createOrder(createOrderDto);

      expect(orderService.createOrder).toHaveBeenCalledWith(createOrderDto);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw an exception when orderService.createOrder throws', async () => {
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

      const errorMessage = 'Some seats are already taken';
      mockOrderService.createOrder.mockRejectedValue(new Error(errorMessage));

      await expect(controller.createOrder(createOrderDto)).rejects.toThrowError(
        errorMessage,
      );
    });
  });
});
