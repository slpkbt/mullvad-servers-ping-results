import 'reflect-metadata';
import { Container } from 'inversify';

import { TYPES } from './types';
import { IServerFetcherService, IPingService, IOutputGeneratorService, IHistoryAnalyzerService, IWebServerService } from '@/interfaces/services.interface';
import { ServerFetcherService } from '@/services/serverFetcher.service';
import { PingService } from '@/services/ping.service';
import { OutputGeneratorService } from '@/services/outputGenerator.service';
import { HistoryAnalyzerService } from '@/services/historyAnalyzer.service';
import { WebServerService } from '@/services/webServer.service';

/**
 * Контейнер для внедрения зависимостей
 * Используется для управления зависимостями и их жизненным циклом
 */
const container = new Container();

// Регистрируем сервисы в контейнере
container.bind<IServerFetcherService>(TYPES.ServerFetcherService).to(ServerFetcherService).inSingletonScope();
container.bind<IPingService>(TYPES.PingService).to(PingService).inSingletonScope();
container.bind<IOutputGeneratorService>(TYPES.OutputGeneratorService).to(OutputGeneratorService).inSingletonScope();
container.bind<IHistoryAnalyzerService>(TYPES.HistoryAnalyzerService).to(HistoryAnalyzerService).inSingletonScope();
container.bind<IWebServerService>(TYPES.WebServerService).to(WebServerService).inSingletonScope();

export { container }; 