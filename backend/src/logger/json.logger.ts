import { Injectable, LoggerService, Optional } from '@nestjs/common';

/**
 * Логгер, выводящий сообщения в формате JSON.
 * Реализует интерфейс LoggerService NestJS.
 */
@Injectable()
export class JsonLogger implements LoggerService {
  // Контекст логирования (например, имя сервиса/модуля)
  private context?: string;

  /**
   * Конструктор с опциональным контекстом логирования.
   * @param context — контекст (например, 'AuthService')
   */
  constructor(@Optional() context?: string) {
    this.context = context;
  }

  /**
   * Устанавливает контекст логирования.
   * @param context — новый контекст
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Формирует JSON‑строку для лога.
   * Включает уровень, временную метку, сообщение, контекст (если есть) и доп. параметры.
   * @param level — уровень логирования ('log', 'error' и т. д.)
   * @param message — основное сообщение
   * @param optionalParams — дополнительные параметры
   * @returns JSON‑строка с данными лога
   */
  formatMessage(
    level: string,
    message: unknown,
    ...optionalParams: unknown[]
  ): string {
    const logEntry: Record<string, unknown> = {
      level,
      timestamp: new Date().toISOString(),
      // Преобразуем сообщение в строку или JSON
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };

    // Добавляем контекст, если задан
    if (this.context) {
      logEntry.context = this.context;
    }

    // Добавляем дополнительные параметры, если переданы
    if (optionalParams && optionalParams.length > 0) {
      logEntry.optionalParams = optionalParams.map((p) =>
        typeof p === 'string' ? p : JSON.stringify(p),
      );
    }

    return JSON.stringify(logEntry);
  }

  /** Логирует сообщение с уровнем 'log' */
  log(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('log', message, ...optionalParams));
  }

  /** Логирует ошибку с уровнем 'error' */
  error(message: unknown, ...optionalParams: unknown[]) {
    console.error(this.formatMessage('error', message, ...optionalParams));
  }

  /** Логирует предупреждение с уровнем 'warn' */
  warn(message: unknown, ...optionalParams: unknown[]) {
    console.warn(this.formatMessage('warn', message, ...optionalParams));
  }

  /** Логирует отладочное сообщение с уровнем 'debug' */
  debug(message: unknown, ...optionalParams: unknown[]) {
    console.debug(this.formatMessage('debug', message, ...optionalParams));
  }

  /** Логирует подробное сообщение с уровнем 'verbose' */
  verbose(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('verbose', message, ...optionalParams));
  }
}
