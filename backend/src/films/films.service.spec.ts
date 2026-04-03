import { Test, TestingModule } from '@nestjs/testing';
import { FilmsService } from './films.service';
import { FILMS_REPOSITORY } from '../common/constants';
import { FilmResponseDto, ScheduleDto } from './dto/films.dto';
import { NotFoundException } from '@nestjs/common';

describe('FilmsService', () => {
  let service: FilmsService;
  let mockFilmsRepository: any;

  const mockFilm: FilmResponseDto = {
    id: '1',
    rating: 8.5,
    director: 'Director 1',
    tags: ['action'],
    image: 'image1.jpg',
    cover: 'cover1.jpg',
    title: 'Film 1',
    about: 'About film 1',
    description: 'Description film 1',
  };

  const mockSchedule: ScheduleDto = {
    id: 'schedule1',
    daytime: '2024-01-15T19:00:00',
    hall: 'Hall 1',
    rows: 10,
    seats: 100,
    price: 500,
    taken: ['A1', 'A2'],
  };

  beforeEach(async () => {
    mockFilmsRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findAllSchedules: jest.fn(),
      findSchedule: jest.fn(),
      updateScheduleTaken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilmsService,
        {
          provide: FILMS_REPOSITORY,
          useValue: mockFilmsRepository,
        },
      ],
    }).compile();

    service = module.get<FilmsService>(FilmsService);
  });

  describe('getAllFilms', () => {
    it('should call repository findAll and return films', async () => {
      mockFilmsRepository.findAll.mockResolvedValue([mockFilm]);

      const result = await service.getAllFilms();

      expect(result).toEqual([mockFilm]);
      expect(mockFilmsRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('getFilmById', () => {
    it('should return film when found', async () => {
      mockFilmsRepository.findById.mockResolvedValue(mockFilm);

      const result = await service.getFilmById('1');

      expect(result).toBe(mockFilm);
      expect(mockFilmsRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when film not found', async () => {
      mockFilmsRepository.findById.mockResolvedValue(null);

      await expect(service.getFilmById('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFilmsRepository.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('getFilmSchedules', () => {
    it('should return schedules when film exists', async () => {
      mockFilmsRepository.findById.mockResolvedValue(mockFilm);
      mockFilmsRepository.findAllSchedules.mockResolvedValue([mockSchedule]);

      const result = await service.getFilmSchedules('1');

      expect(result).toEqual([mockSchedule]);
      expect(mockFilmsRepository.findById).toHaveBeenCalledWith('1');
      expect(mockFilmsRepository.findAllSchedules).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if film does not exist', async () => {
      mockFilmsRepository.findById.mockResolvedValue(null);

      await expect(service.getFilmSchedules('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFilmSchedule', () => {
    it('should return schedule when found', async () => {
      mockFilmsRepository.findSchedule.mockResolvedValue(mockSchedule);

      const result = await service.getFilmSchedule('1', 'schedule1');

      expect(result).toBe(mockSchedule);
      expect(mockFilmsRepository.findSchedule).toHaveBeenCalledWith(
        '1',
        'schedule1',
      );
    });

    it('should throw NotFoundException when schedule not found', async () => {
      mockFilmsRepository.findSchedule.mockResolvedValue(null);

      await expect(service.getFilmSchedule('1', '999')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFilmsRepository.findSchedule).toHaveBeenCalledWith('1', '999');
    });
  });

  describe('updateTakenSeats', () => {
    it('should call repository updateScheduleTaken with correct parameters', async () => {
      const filmId = '1';
      const scheduleId = 'schedule1';
      const takenSeats = ['A1', 'A2'];

      await service.updateTakenSeats(filmId, scheduleId, takenSeats);

      expect(mockFilmsRepository.updateScheduleTaken).toHaveBeenCalledWith(
        filmId,
        scheduleId,
        takenSeats,
      );
    });
  });
});
