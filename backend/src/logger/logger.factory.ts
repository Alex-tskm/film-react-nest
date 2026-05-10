import { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevLogger } from './dev.logger';
import { JsonLogger } from './json.logger';
import { TskvLogger } from './tskv.logger';

/** Тип, определяющий доступные форматы логирования */
export type LoggerType = 'dev' | 'json' | 'tskv';

/**
 * Фабрика для создания экземпляров логгеров.
 * Выбирает реализацию логгера на основе конфигурации (переменной окружения или ConfigService).
 */
export class LoggerFactory {
  /**
   * Создаёт экземпляр логгера заданного типа.
   * Сначала пытается получить формат из ConfigService, затем — из переменной окружения LOG_FORMAT.
   * По умолчанию используется 'dev'.
   * @param configService — сервис конфигурации NestJS (опционально)
   * @returns экземпляр логгера, реализующий LoggerService
   */
  static createLogger(configService?: ConfigService): LoggerService {
    let loggerType: LoggerType = 'dev';

    if (configService) {
      // Получаем формат логов из конфигурации, по умолчанию — 'dev'
      const envType = configService
        .get<string>('LOG_FORMAT', 'dev')
        .toLowerCase();
      if (envType === 'json') {
        loggerType = 'json';
      } else if (envType === 'tskv') {
        loggerType = 'tskv';
      }
    } else {
      // Если ConfigService не передан, берём формат из переменной окружения
      const envType = process.env.LOG_FORMAT || 'dev';
      if (envType === 'json') {
        loggerType = 'json';
      } else if (envType === 'tskv') {
        loggerType = 'tskv';
      }
    }

    console.log(`📝 Initializing logger: ${loggerType}`);

    // Создаём и возвращаем экземпляр нужного логгера
    switch (loggerType) {
      case 'json':
        return new JsonLogger();
      case 'tskv':
        return new TskvLogger();
      default:
        return new DevLogger();
    }
  }

  /**
   * Получает текущий тип логгера из переменной окружения LOG_FORMAT.
   * Если переменная не задана, возвращает 'dev'.
   * @returns тип логгера ('dev', 'json' или 'tskv')
   */
  static getLoggerType(): LoggerType {
    const type = process.env.LOG_FORMAT || 'dev';
    if (type === 'json') return 'json';
    if (type === 'tskv') return 'tskv';
    return 'dev';
  }
}
