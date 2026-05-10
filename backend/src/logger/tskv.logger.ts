import { Injectable, LoggerService, Optional } from '@nestjs/common';

@Injectable()
export class TskvLogger implements LoggerService {
  // Контекст логирования (например, имя сервиса)
  private context?: string;

  // Конструктор с опциональным контекстом
  constructor(@Optional() context?: string) {
    this.context = context;
  }

  // Устанавливает контекст логирования
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Экранирует значение для формата TSKV: заменяет \n, \r, \t на пробелы,
   * нормализует пробелы и преобразует в строку.
   * @param value — значение для экранирования
   * @returns экранированная строка
   */
  private escapeTskv(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let str = typeof value === 'string' ? value : JSON.stringify(value);
    // Заменяем управляющие символы на пробелы (разделители в TSKV)
    str = str.replace(/[\n\r\t]/g, ' ');
    // Нормализуем пробелы
    str = str.replace(/\s+/g, ' ').trim();

    return str;
  }

  /**
   * Формирует строку лога в формате TSKV (level=...	timestamp=...	message=...).
   * Включает обязательные поля, контекст (если есть) и доп. параметры.
   * @param level — уровень логирования ('log', 'error' и т. д.)
   * @param message — основное сообщение
   * @param optionalParams — дополнительные параметры
   * @returns строка в формате TSKV
   */
  formatMessage(level: string, message: unknown, ...optionalParams: unknown[]): string {
    const fields: string[] = [];

    // Обязательные поля
    fields.push(`level=${this.escapeTskv(level)}`);
    fields.push(`timestamp=${this.escapeTskv(new Date().toISOString())}`);
    fields.push(`message=${this.escapeTskv(message)}`);

    // Добавляем контекст, если задан
    if (this.context) {
      fields.push(`context=${this.escapeTskv(this.context)}`);
    }

    // Обрабатываем дополнительные параметры
    if (optionalParams.length > 0) {
      const formattedParams = optionalParams
        .map((p) => (typeof p === 'string' ? p : JSON.stringify(p)))
        .join(', ');
      fields.push(`params=${this.escapeTskv(formattedParams)}`);
    }

    // Объединяем поля табуляцией
    return fields.join('\t');
  }

  // Логирует сообщение с уровнем 'log' через console.log
  log(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('log', message, ...optionalParams));
  }

  // Логирует ошибку с уровнем 'error' через console.error
  error(message: unknown, ...optionalParams: unknown[]) {
    console.error(this.formatMessage('error', message, ...optionalParams));
  }

  // Логирует предупреждение с уровнем 'warn' через console.warn
  warn(message: unknown, ...optionalParams: unknown[]) {
    console.warn(this.formatMessage('warn', message, ...optionalParams));
  }

  // Логирует отладочное сообщение с уровнем 'debug' через console.debug
  debug(message: unknown, ...optionalParams: unknown[]) {
    console.debug(this.formatMessage('debug', message, ...optionalParams));
  }

  // Логирует подробное сообщение с уровнем 'verbose' через console.log
  verbose(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.formatMessage('verbose', message, ...optionalParams));
  }
}
