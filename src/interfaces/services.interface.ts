import { IMullvadServer, IPingResult, IPingStatistics, IHistoricalData, IFilterOptions, IPingOptions, IOutputOptions } from './server.interface';

/**
 * Интерфейс для сервиса получения серверов
 * Отвечает за получение списка серверов от API Mullvad
 */
export interface IServerFetcherService {
  /**
   * Получает список серверов из API или кэша
   * @returns Промис с массивом серверов
   */
  fetchServers(): Promise<IMullvadServer[]>;

  /**
   * Получает список серверов напрямую из API
   * @param retries Количество попыток получения данных
   * @returns Промис с массивом серверов
   */
  fetchServersFromAPI(retries?: number): Promise<IMullvadServer[]>;

  /**
   * Сохраняет список серверов в кэш
   * @param servers Список серверов для сохранения
   */
  saveServersToCache(servers: IMullvadServer[]): Promise<void>;

  /**
   * Загружает список серверов из кэша
   * @returns Промис с массивом серверов из кэша
   */
  loadServersFromCache(): Promise<IMullvadServer[]>;

  /**
   * Фильтрует список серверов по заданным критериям
   * @param servers Список серверов для фильтрации
   * @returns Отфильтрованный массив серверов
   */
  filterServers(servers: IMullvadServer[]): IMullvadServer[];
}

/**
 * Интерфейс для сервиса пинга серверов
 * Отвечает за проверку доступности и производительности серверов
 */
export interface IPingService {
  /**
   * Пингует один сервер
   * @param server Сервер для пинга
   * @param retryCount Количество повторных попыток
   * @returns Промис с результатом пинга
   */
  pingServer(server: IMullvadServer, retryCount?: number): Promise<IPingResult>;

  /**
   * Пингует все серверы из списка
   * @param servers Список серверов для пинга
   * @returns Промис с результатами пинга
   */
  pingAllServers(servers: IMullvadServer[]): Promise<IPingResult[]>;

  /**
   * Определяет статус пинга на основе порогов
   * @param pingTime Время пинга в мс
   * @returns Статус: 'good', 'medium', или 'bad'
   */
  getPingStatus(pingTime: number): 'good' | 'medium' | 'bad';
}

/**
 * Интерфейс для сервиса генерации выходных данных
 * Отвечает за создание различных форматов отчетов о результатах пинга
 */
export interface IOutputGeneratorService {
  /**
   * Генерирует статистику по результатам пинга
   * @param results Результаты пинга
   * @returns Статистика пинга
   */
  generateStatistics(results: IPingResult[]): IPingStatistics;

  /**
   * Сохраняет результаты в файл
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param options Опции вывода
   * @returns Промис, завершающийся после сохранения всех форматов
   */
  saveResults(results: IPingResult[], statistics: IPingStatistics, options: IOutputOptions): Promise<string>;

  /**
   * Выводит результаты в консоль
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param options Опции вывода
   */
  printResults(results: IPingResult[], statistics: IPingStatistics, options: IOutputOptions): void;

  /**
   * Генерирует HTML-отчет
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @returns HTML-строка с отчетом
   */
  generateHtmlReport(results: IPingResult[], statistics: IPingStatistics): string;

  /**
   * Генерирует JSON-отчет
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @returns JSON-строка с отчетом
   */
  generateJsonReport(results: IPingResult[], statistics: IPingStatistics): string;

  /**
   * Генерирует CSV-отчет
   * @param results Результаты пинга
   * @returns CSV-строка с отчетом
   */
  generateCsvReport(results: IPingResult[]): string;
}

/**
 * Интерфейс для сервиса анализа исторических данных
 * Отвечает за анализ исторических данных о пинге серверов
 */
export interface IHistoryAnalyzerService {
  /**
   * Сохраняет текущие результаты в историю
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   */
  saveToHistory(results: IPingResult[], statistics: IPingStatistics): Promise<void>;

  /**
   * Загружает исторические данные
   * @returns Промис с массивом исторических результатов
   */
  loadHistory(): Promise<IHistoricalData[]>;

  /**
   * Анализирует изменения в производительности серверов
   * @param history Исторические данные
   * @returns Анализ изменений
   */
  analyzePerformanceTrends(history: IHistoricalData[]): any;

  /**
   * Находит наиболее стабильные серверы
   * @param history Исторические данные
   * @param count Количество серверов для вывода
   * @returns Массив стабильных серверов с метриками
   */
  findMostStableServers(history: IHistoricalData[], count?: number): any;
}

/**
 * Интерфейс для веб-сервера
 * Отвечает за предоставление интерактивного веб-интерфейса
 */
export interface IWebServerService {
  /**
   * Запускает веб-сервер
   * @param port Порт для запуска сервера
   * @returns Промис, завершающийся после запуска сервера
   */
  start(port?: number): Promise<void>;

  /**
   * Останавливает веб-сервер
   * @returns Промис, завершающийся после остановки сервера
   */
  stop(): Promise<void>;

  /**
   * Обновляет данные на веб-сервере
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param history Исторические данные
   */
  updateData(results: IPingResult[], statistics: IPingStatistics, history?: IHistoricalData[]): void;
} 