import { LoggerFactory } from '../logger.factory';
import { DevLogger } from '../dev.logger';
import { JsonLogger } from '../json.logger';
import { TskvLogger } from '../tskv.logger';

/**
 * Тесты для фабрики логгеров (LoggerFactory).
 * Проверяют выбор реализации логгера на основе переменной окружения LOG_FORMAT.
 */
describe('LoggerFactory', () => {
  const originalEnv = process.env;

  /**
   * Перед каждым тестом — создаём копию окружения, чтобы изолировать изменения.
   */
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  /**
   * После каждого теста — восстанавливаем исходное окружение и очищаем моки.
   */
  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  /**
   * Группа тестов для метода createLogger.
   * Проверяет, какой логгер возвращается в зависимости от значения LOG_FORMAT.
   */
  describe('createLogger', () => {
    it('should return DevLogger when LOG_FORMAT is dev', () => {
      process.env.LOG_FORMAT = 'dev';
      const logger = LoggerFactory.createLogger();
      // Проверяем, что создан экземпляр DevLogger
      expect(logger).toBeInstanceOf(DevLogger);
    });

    it('should return JsonLogger when LOG_FORMAT is json', () => {
      process.env.LOG_FORMAT = 'json';
      const logger = LoggerFactory.createLogger();
      // Проверяем, что создан экземпляр JsonLogger
      expect(logger).toBeInstanceOf(JsonLogger);
    });

    it('should return TskvLogger when LOG_FORMAT is tskv', () => {
      process.env.LOG_FORMAT = 'tskv';
      const logger = LoggerFactory.createLogger();
      // Проверяем, что создан экземпляр TskvLogger
      expect(logger).toBeInstanceOf(TskvLogger);
    });

    it('should default to DevLogger when LOG_FORMAT is not set', () => {
      delete process.env.LOG_FORMAT;
      const logger = LoggerFactory.createLogger();
      // Проверяем возврат DevLogger по умолчанию, если переменная не задана
      expect(logger).toBeInstanceOf(DevLogger);
    });

    it('should default to DevLogger when LOG_FORMAT is invalid', () => {
      process.env.LOG_FORMAT = 'invalid';
      const logger = LoggerFactory.createLogger();
      // Проверяем возврат DevLogger при некорректном значении переменной
      expect(logger).toBeInstanceOf(DevLogger);
    });
  });

  /**
   * Группа тестов для метода getLoggerType.
   * Проверяет корректность определения типа логгера по переменной окружения.
   */
  describe('getLoggerType', () => {
    it('should return dev by default', () => {
      delete process.env.LOG_FORMAT;
      // Проверяем возврат 'dev' по умолчанию
      expect(LoggerFactory.getLoggerType()).toBe('dev');
    });

    it('should return json when set', () => {
      process.env.LOG_FORMAT = 'json';
      // Проверяем возврат 'json' при соответствующем значении переменной
      expect(LoggerFactory.getLoggerType()).toBe('json');
    });

    it('should return tskv when set', () => {
      process.env.LOG_FORMAT = 'tskv';
      // Проверяем возврат 'tskv' при соответствующем значении переменной
      expect(LoggerFactory.getLoggerType()).toBe('tskv');
    });
  });
});
