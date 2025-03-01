/**
 * Символы для идентификации сервисов в контейнере внедрения зависимостей
 */
export const TYPES = {
  ServerFetcherService: Symbol.for('ServerFetcherService'),
  PingService: Symbol.for('PingService'),
  OutputGeneratorService: Symbol.for('OutputGeneratorService'),
  HistoryAnalyzerService: Symbol.for('HistoryAnalyzerService'),
  WebServerService: Symbol.for('WebServerService'),
}; 