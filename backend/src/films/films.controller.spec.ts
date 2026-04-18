import { Test, TestingModule } from '@nestjs/testing';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { FilmResponseDto, ScheduleDto } from './dto/films.dto';
import { NotFoundException } from '@nestjs/common';

describe('FilmsController', () => {
  let controller: FilmsController;
  let filmsService: jest.Mocked<FilmsService>;

  const mockFilms: FilmResponseDto[] = [
    {
      id: '1',
      rating: 8.5,
      director: 'Director 1',
      tags: ['action'],
      image: 'image1.jpg',
      cover: 'cover1.jpg',
      title: 'Film 1',
      about: 'About film 1',
      description: 'Description film 1',
    },
  ];

  const mockSchedule: ScheduleDto[] = [
    {
      id: 'schedule1',
      daytime: '2024-01-15T19:00:00',
      hall: 1,
      rows: 10,
      seats: 100,
      price: 500,
      taken: ['A1', 'A2'],
    },
  ];

  beforeEach(async () => {
    const mockFilmsService = {
      getAllFilms: jest.fn(),
      getFilmById: jest.fn(),
      getFilmSchedules: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilmsController],
      providers: [
        {
          provide: FilmsService,
          useValue: mockFilmsService,
        },
      ],
    }).compile();

    controller = module.get<FilmsController>(FilmsController);
    filmsService = module.get(FilmsService);
  });

  describe('getFilms', () => {
    it('should return films list with correct structure', async () => {
      filmsService.getAllFilms.mockResolvedValue(mockFilms);

      const result = await controller.getFilms();

      expect(result).toEqual({
        message: 'GET /api/afisha/films/ — список фильмов',
        total: 1,
        items: mockFilms,
      });
      expect(filmsService.getAllFilms).toHaveBeenCalled();
    });
  });

  describe('getFilmById', () => {
    it('should return film when found', async () => {
      const filmId = '1';
      filmsService.getFilmById.mockResolvedValue(mockFilms[0]);

      const result = await controller.getFilmById(filmId);

      expect(result).toBe(mockFilms[0]);
      expect(filmsService.getFilmById).toHaveBeenCalledWith(filmId);
    });

    it('should throw NotFoundException when film not found', async () => {
      const filmId = '999';
      filmsService.getFilmById.mockResolvedValue(null);

      await expect(controller.getFilmById(filmId)).rejects.toThrow(
        NotFoundException,
      );
      expect(filmsService.getFilmById).toHaveBeenCalledWith(filmId);
    });
  });

  describe('getFilmSchedule', () => {
    it('should return schedule with correct structure', async () => {
      const filmId = '1';
      filmsService.getFilmSchedules.mockResolvedValue(mockSchedule);

      const result = await controller.getFilmSchedule(filmId);

      expect(result).toEqual({
        message: `GET /api/afisha/films/${filmId}/schedule — расписание сеансов для фильма с ID ${filmId}`,
        total: 1,
        items: mockSchedule,
      });
      expect(filmsService.getFilmSchedules).toHaveBeenCalledWith(filmId);
    });
  });
});
