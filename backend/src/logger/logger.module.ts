import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerFactory } from './logger.factory';
import { DevLogger } from './dev.logger';
import { JsonLogger } from './json.logger';
import { TskvLogger } from './tskv.logger';

/**
 * Глобальный модуль логирования для NestJS-приложения.
 * Делает сервисы логирования доступными во всех модулях приложения.
 */
@Global()
@Module({})
export class LoggerModule {
  /**
   * Статический метод для настройки модуля логирования.
   * Создаёт провайдер логгера на основе конфигурации приложения.
   * @returns DynamicModule — динамически сконфигурированный модуль
   */
  static forRoot(): DynamicModule {
    // Провайдер основного сервиса логирования с фабричной функцией
    const loggerProvider = {
      // Токен внедрения ('LOGGER_SERVICE') для доступа к основному логгеру
      provide: 'LOGGER_SERVICE',
      // Фабрика создаёт экземпляр логгера через LoggerFactory
      useFactory: (configService: ConfigService) => {
        return LoggerFactory.createLogger(configService);
      },
      // Внедрение зависимости: ConfigService для получения настроек
      inject: [ConfigService],
    };

    return {
      module: LoggerModule,
      providers: [
        loggerProvider,
        // Провайдеры для конкретных реализаций логгеров
        {
          // Токен: класс DevLogger
          provide: DevLogger,
          // Фабрика создаёт новый экземпляр DevLogger
          useFactory: () => new DevLogger(),
        },
        {
          // Токен: класс JsonLogger
          provide: JsonLogger,
          // Фабрика создаёт новый экземпляр JsonLogger
          useFactory: () => new JsonLogger(),
        },
        {
          // Токен: класс TskvLogger
          provide: TskvLogger,
          // Фабрика создаёт новый экземпляр TskvLogger
          useFactory: () => new TskvLogger(),
        },
      ],
      // Экспортируемые провайдеры — доступны для внедрения в других модулях
      exports: ['LOGGER_SERVICE', DevLogger, JsonLogger, TskvLogger],
    };
  }
}
