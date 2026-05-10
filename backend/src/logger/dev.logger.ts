import { Injectable, LoggerService, Optional } from '@nestjs/common';

/**
 * Логгер для разработки (dev‑режим).
 * Выводит сообщения в человеко‑читаемом текстовом формате.
 * Реализует интерфейс LoggerService NestJS.
 */
@Injectable()
export class DevLogger implements LoggerService {
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
   * Формирует текстовое сообщение лога в читаемом формате.
   * Формат: [timestamp] LEVEL [context] message [дополнительные параметры].
   * @param level — уровень логирования ('log', 'error' и т. д.)
   * @param message — основное сообщение
   * @param optionalParams — дополнительные параметры
   * @returns отформатированная строка для вывода в консоль
   */
  formatMessage(
    level: string,
    message: unknown,
    ...optionalParams: unknown[]
  ): string {
    const timestamp = new Date().toISOString();
    // Формируем строку с контекстом (если задан): '[Context] '
    const contextStr = this.context ? `[${this.context}] ` : '';
    // Обрабатываем дополнительные параметры: преобразуем в строки и объединяем через пробел
    const paramsStr = optionalParams.length
      ? ` ${optionalParams
          .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
          .join(' ')}`
      : '';

    // Собираем итоговую строку: время + уровень + контекст + сообщение + доп. параметры
    return `${timestamp} ${level.toUpperCase()} ${contextStr}${message}${paramsStr}`;
  }

  /** Логирует информационное сообщение с уровнем 'log' */
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
