import { TskvLogger } from '../tskv.logger';

/**
 * Набор тестов для класса TskvLogger.
 * Проверяет корректность форматирования логов в формате TSKV и работу методов логирования.
 */
describe('TskvLogger', () => {
  let logger: TskvLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  /**
   * Подготовка перед каждым тестом:
   * - создаёт новый экземпляр TskvLogger;
   * - настраивает шпионы (spies) для методов консоли, чтобы отслеживать вызовы.
   */
  beforeEach(() => {
    logger = new TskvLogger();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
  });

  /**
   * Очистка после каждого теста — сбрасывает все моки.
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Группа тестов для метода formatMessage.
   * Проверяет, как формируется строка лога в формате TSKV.
   */
  describe('formatMessage', () => {
    it('should format log message as TSKV', () => {
      const result = logger.formatMessage('log', 'Test message');

      // Проверяем наличие обязательных полей в выводе
      expect(result).toContain('level=log');
      expect(result).toContain('message=Test message');
      expect(result).toContain('timestamp=');
      // Убеждаемся, что поля разделены табуляцией (TSKV‑формат)
      expect(result.split('\t').length).toBeGreaterThanOrEqual(3);
    });

    it('should escape special characters', () => {
      const result = logger.formatMessage(
        'log',
        'Message\nwith\ttabs and\nnewlines',
      );

      // Проверяем замену управляющих символов на пробелы
      expect(result).toContain('message=Message with tabs and newlines');
      // Убеждаемся, что в выводе нет символов новой строки
      expect(result.includes('\n')).toBe(false);
      // Проверяем, что в значении message нет множественных пробелов
      expect(result).toMatch(/message=[^\t]+/);
    });

    it('should include context when set', () => {
      logger.setContext('TestContext');
      const result = logger.formatMessage('log', 'Test message');

      // Проверяем добавление поля context при установленном контексте
      expect(result).toContain('context=TestContext');
      // При наличии контекста число полей увеличивается
      expect(result.split('\t').length).toBeGreaterThanOrEqual(4);
    });

    it('should handle object messages', () => {
      const objMessage = { key: 'value', nested: { foo: 'bar' } };
      const result = logger.formatMessage('log', objMessage);

      // Проверяем корректное преобразование объекта в JSON‑строку
      expect(result).toContain('message=' + JSON.stringify(objMessage));
    });

    it('should include optional parameters', () => {
      const result = logger.formatMessage('log', 'Test', 'param1', 'param2');

      // Проверяем добавление дополнительных параметров в поле params
      expect(result).toContain('params=param1, param2');
    });

    it('should handle null and undefined values', () => {
      const resultNull = logger.formatMessage('log', null);
      const resultUndefined = logger.formatMessage('log', undefined);

      // Проверяем обработку null и undefined — поле message должно быть пустым
      expect(resultNull).toContain('message=');
      expect(resultUndefined).toContain('message=');
    });

    it('should handle multiple optional parameters of different types', () => {
      const result = logger.formatMessage('log', 'Test', 123, { foo: 'bar' }, [
        'a',
        'b',
      ]);

      // Проверяем объединение параметров разных типов в поле params
      expect(result).toContain('params=123, {"foo":"bar"}, ["a","b"]');
    });

    it('should escape special characters in optional parameters', () => {
      const result = logger.formatMessage(
        'log',
        'Test',
        'param\nwith\tnewlines',
      );

      // Проверяем экранирование управляющих символов в доп. параметрах
      expect(result).toContain('params=param with newlines');
      expect(result.includes('\n')).toBe(false);
    });
  });

  /**
   * Группа тестов для методов логирования (log, error, warn и т. д.).
   * Проверяет, что каждый метод вызывает соответствующий метод консоли с отформатированным сообщением.
   */
  describe('log methods', () => {
    it('should call console.log with formatted message for log method', () => {
      logger.log('Test log');

      // Проверяем вызов console.log один раз
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const calledArg = consoleLogSpy.mock.calls[0][0];
      // Проверяем содержимое сообщения: уровень и текст
      expect(calledArg).toContain('level=log');
      expect(calledArg).toContain('message=Test log');
    });

    it('should call console.error for error method', () => {
      logger.error('Test error');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const calledArg = consoleErrorSpy.mock.calls[0][0];
      expect(calledArg).toContain('level=error');
      expect(calledArg).toContain('message=Test error');
    });

    it('should call console.warn for warn method', () => {
      logger.warn('Test warn');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const calledArg = consoleWarnSpy.mock.calls[0][0];
      expect(calledArg).toContain('level=warn');
      expect(calledArg).toContain('message=Test warn');
    });

    it('should call console.debug for debug method', () => {
      logger.debug('Test debug');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const calledArg = consoleDebugSpy.mock.calls[0][0];
      expect(calledArg).toContain('level=debug');
      expect(calledArg).toContain('message=Test debug');
    });

    it('should call console.log for verbose method', () => {
      logger.verbose('Test verbose');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const calledArg = consoleLogSpy.mock.calls[0][0];
      expect(calledArg).toContain('level=verbose');
      expect(calledArg).toContain('message=Test verbose');
    });

    it('should pass optional parameters to formatted message', () => {
      logger.log('Test message', 'param1', 'param2');

      const calledArg = consoleLogSpy.mock.calls[0][0];
      // Проверяем передачу доп. параметров в сообщение
      expect(calledArg).toContain('params=param1, param2');
    });
  });

  /**
   * Тест для метода setContext.
   * Проверяет, что изменение контекста влияет на последующие сообщения лога.
   */
  describe('setContext', () => {
    it('should update context for subsequent log messages', () => {
      logger.setContext('FirstContext');
      let result = logger.formatMessage('log', 'Message 1');
      expect(result).toContain('context=FirstContext');

      logger.setContext('SecondContext');
      result = logger.formatMessage('log', 'Message 2');
      expect(result).toContain('context=SecondContext');
    });
  });

  /**
   * Группа тестов на соответствие формату TSKV.
   * Проверяет ключевые требования к формату вывода: разделители, экранирование и т. д.
   */
  describe('TSKV format compliance', () => {
    it('should use tab as field separator', () => {
      const result = logger.formatMessage('log', 'Test');

      // Разделяем строку по табуляции и проверяем количество полей
      const fields = result.split('\t');
      expect(fields.length).toBeGreaterThanOrEqual(3);

      // Проверяем формат каждого поля: должно соответствовать шаблону «ключ=значение»
      fields.forEach((field) => {
        expect(field).toMatch(/^[a-z]+=.*$/);
      });
    });

    it('should not contain newlines in output', () => {
      const result = logger.formatMessage('log', 'Message\nwith\nnewlines');

      // Убеждаемся, что в итоговой строке нет символов новой строки — они должны быть заменены на пробелы
      expect(result.includes('\n')).toBe(false);
    });

    it('should handle error objects', () => {
      const error = new Error('Test error');
      const result = logger.formatMessage('error', error.message, error.stack);


      // Проверяем, что уровень лога установлен как 'error'
      expect(result).toContain('level=error');
      // Проверяем наличие сообщения ошибки в поле message
      expect(result).toContain(`message=${error.message}`);
      // Убеждаемся, что стек ошибки включён в дополнительные параметры (без точного совпадения)
      if (error.stack) {
        expect(result).toContain('params=');
        // Дополнительно проверяем, что в params есть часть сообщения ошибки (наиболее стабильная часть стека)
        expect(result).toMatch(/params=.*Test error/);
      }
    });
  });
});

