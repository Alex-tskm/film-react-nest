import { JsonLogger } from '../json.logger';

/**
 * Тесты для класса JsonLogger.
 * Проверяют корректность форматирования логов в формате JSON и работу методов логирования.
 */
describe('JsonLogger', () => {
  let logger: JsonLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  /**
   * Перед каждым тестом:
   * - создаёт новый экземпляр JsonLogger;
   * - настраивает шпионы для методов консоли (log, error, warn) для отслеживания вызовов.
   */
  beforeEach(() => {
    logger = new JsonLogger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  /**
   * После каждого теста — сбрасывает все моки (имитации вызовов).
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Группа тестов для метода formatMessage.
   * Проверяет, как формируется JSON‑строка лога.
   */
  describe('formatMessage', () => {
    it('should format log message as JSON', () => {
      const result = logger.formatMessage('log', 'Test message');
      const parsed = JSON.parse(result);

      // Проверяем наличие и корректность обязательных полей в JSON
      expect(parsed).toHaveProperty('level', 'log');
      expect(parsed).toHaveProperty('message', 'Test message');
      expect(parsed).toHaveProperty('timestamp');
    });

    it('should include context when set', () => {
      logger.setContext('TestContext');
      const result = logger.formatMessage('log', 'Test message');
      const parsed = JSON.parse(result);

      // Проверяем добавление поля context при установленном контексте
      expect(parsed).toHaveProperty('context', 'TestContext');
    });

    it('should handle object messages', () => {
      const objMessage = { key: 'value', nested: { foo: 'bar' } };
      const result = logger.formatMessage('log', objMessage);
      const parsed = JSON.parse(result);

      // Проверяем, что объект корректно преобразован в строку в поле message
      expect(parsed.message).toBe(JSON.stringify(objMessage));
    });

    it('should include optional parameters', () => {
      const result = logger.formatMessage('log', 'Test', 'param1', 'param2');
      const parsed = JSON.parse(result);

      // Проверяем добавление дополнительных параметров в массив optionalParams
      expect(parsed.optionalParams).toEqual(['param1', 'param2']);
    });
  });

  /**
   * Группа тестов для методов логирования (log, error, warn).
   * Проверяет, что каждый метод вызывает соответствующий метод консоли с JSON‑сообщением.
   */
  describe('log methods', () => {
    it('should call console.log for log method', () => {
      logger.log('Test log');
      // Проверяем вызов console.log
      expect(consoleLogSpy).toHaveBeenCalled();
      const calledArg = consoleLogSpy.mock.calls[0][0];
      // Проверяем уровень лога в JSON‑сообщении
      expect(JSON.parse(calledArg).level).toBe('log');
    });

    it('should call console.error for error method', () => {
      logger.error('Test error');
      // Проверяем вызов console.error
      expect(consoleErrorSpy).toHaveBeenCalled();
      const calledArg = consoleErrorSpy.mock.calls[0][0];
      // Проверяем уровень лога в JSON‑сообщении
      expect(JSON.parse(calledArg).level).toBe('error');
    });

    it('should call console.warn for warn method', () => {
      logger.warn('Test warn');
      // Проверяем вызов console.warn
      expect(consoleWarnSpy).toHaveBeenCalled();
      const calledArg = consoleWarnSpy.mock.calls[0][0];
      // Проверяем уровень лога в JSON‑сообщении
      expect(JSON.parse(calledArg).level).toBe('warn');
    });
  });
});
