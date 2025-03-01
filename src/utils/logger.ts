import chalk from 'chalk';

/**
 * Уровни логирования
 */
export enum ELogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Класс для логирования с поддержкой цветов и уровней логирования
 */
export class Logger {
  private static logLevel: ELogLevel = ELogLevel.INFO;
  private readonly context: string;

  /**
   * Создает экземпляр логгера
   * @param context Контекст логирования (обычно имя класса)
   */
  constructor(context: string) {
    this.context = context;
  }

  /**
   * Устанавливает уровень логирования
   * @param level Уровень логирования
   */
  public static setLogLevel(level: ELogLevel): void {
    Logger.logLevel = level;
  }

  /**
   * Логирует сообщение с уровнем DEBUG
   * @param message Сообщение для логирования
   * @param optionalParams Дополнительные параметры
   */
  public debug(message: string, ...optionalParams: unknown[]): void {
    if (Logger.logLevel >= ELogLevel.DEBUG) {
      this.log(chalk.blue('DEBUG'), message, optionalParams);
    }
  }

  /**
   * Логирует сообщение с уровнем INFO
   * @param message Сообщение для логирования
   * @param optionalParams Дополнительные параметры
   */
  public info(message: string, ...optionalParams: unknown[]): void {
    if (Logger.logLevel >= ELogLevel.INFO) {
      this.log(chalk.green('INFO'), message, optionalParams);
    }
  }

  /**
   * Логирует сообщение с уровнем WARN
   * @param message Сообщение для логирования
   * @param optionalParams Дополнительные параметры
   */
  public warn(message: string, ...optionalParams: unknown[]): void {
    if (Logger.logLevel >= ELogLevel.WARN) {
      this.log(chalk.yellow('WARN'), message, optionalParams);
    }
  }

  /**
   * Логирует сообщение с уровнем ERROR
   * @param message Сообщение для логирования
   * @param optionalParams Дополнительные параметры
   */
  public error(message: string, ...optionalParams: unknown[]): void {
    if (Logger.logLevel >= ELogLevel.ERROR) {
      this.log(chalk.red('ERROR'), message, optionalParams);
    }
  }

  /**
   * Внутренний метод для форматирования и вывода логов
   * @param level Уровень логирования
   * @param message Сообщение для логирования
   * @param optionalParams Дополнительные параметры
   */
  private log(level: string, message: string, optionalParams: unknown[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${level} [${this.context}] ${message}`;
    
    if (optionalParams.length > 0) {
      console.log(formattedMessage, ...optionalParams);
    } else {
      console.log(formattedMessage);
    }
  }
} 