#!/usr/bin/env node
import 'reflect-metadata';
import { Command } from 'commander';
import chalk from 'chalk';

import { container } from '@/config/inversify.config';
import { TYPES } from '@/config/types';
import config from '@/config/config';
import { IServerFetcherService, IPingService, IOutputGeneratorService, IHistoryAnalyzerService, IWebServerService } from '@/interfaces/services.interface';
import { Logger, ELogLevel } from '@/utils/logger';
import { IHistoricalData } from '@/interfaces/server.interface';

/**
 * Основной класс приложения
 * Отвечает за инициализацию и запуск приложения
 */
class Application {
  private readonly logger = new Logger(Application.name);
  private readonly serverFetcherService: IServerFetcherService;
  private readonly pingService: IPingService;
  private readonly outputGeneratorService: IOutputGeneratorService;
  private readonly historyAnalyzerService: IHistoryAnalyzerService;
  private readonly webServerService: IWebServerService;
  private isVerboseMode = false;

  /**
   * Создает экземпляр приложения
   * Инициализирует все необходимые сервисы
   */
  constructor() {
    // Получаем сервисы из контейнера DI
    this.serverFetcherService = container.get<IServerFetcherService>(TYPES.ServerFetcherService);
    this.pingService = container.get<IPingService>(TYPES.PingService);
    this.outputGeneratorService = container.get<IOutputGeneratorService>(TYPES.OutputGeneratorService);
    this.historyAnalyzerService = container.get<IHistoryAnalyzerService>(TYPES.HistoryAnalyzerService);
    this.webServerService = container.get<IWebServerService>(TYPES.WebServerService);
  }

  /**
   * Запускает приложение
   * @returns {Promise<void>}
   */
  public async run(): Promise<void> {
    try {
      this.setupCommandLineInterface();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Application error:', errorMessage);
      process.exit(1);
    }
  }

  /**
   * Настраивает интерфейс командной строки
   */
  private setupCommandLineInterface(): void {
    const program = new Command();

    program
      .name('mullvad-ping-tester')
      .description('Advanced tool for testing ping to Mullvad VPN servers with detailed analytics')
      .version('1.0.0');

    program
      .option('-c, --country <codes>', 'Filter servers by country code (comma-separated)')
      .option('-C, --city <names>', 'Filter servers by city name (comma-separated)')
      .option('-t, --timeout <ms>', 'Ping timeout in milliseconds')
      .option('-r, --retries <number>', 'Number of ping retries')
      .option('-p, --parallel <number>', 'Number of parallel pings')
      .option('-f, --format <formats>', 'Output formats (comma-separated: json,html,csv)')
      .option('-o, --output <path>', 'Path to save results')
      .option('-w, --web', 'Start web server for interactive results')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-q, --quiet', 'Disable all logging except errors');

    program.action(async (options) => {
      // Настраиваем уровень логирования
      if (options.verbose) {
        Logger.setLogLevel(ELogLevel.DEBUG);
        this.isVerboseMode = true;
        this.logger.info('Verbose logging enabled');
      } else if (options.quiet) {
        Logger.setLogLevel(ELogLevel.ERROR);
      }

      // Применяем опции командной строки к конфигурации
      if (options.country) config.COUNTRY_FILTER = options.country;
      if (options.city) config.CITY_FILTER = options.city;
      if (options.timeout) config.PING_TIMEOUT = parseInt(options.timeout, 10);
      if (options.retries) config.PING_RETRIES = parseInt(options.retries, 10);
      if (options.parallel) config.CONCURRENT_PINGS = parseInt(options.parallel, 10);
      if (options.output) config.SAVE_PATH = options.output;
      if (options.format) {
        config.SAVE_FORMATS = options.format.split(',') as Array<'json' | 'html' | 'csv'>;
      }
      if (options.web) config.WEB_SERVER.ENABLED = true;

      await this.startApplication();
    });

    program.parse();
  }

  /**
   * Запускает основную логику приложения
   * @returns {Promise<void>}
   */
  private async startApplication(): Promise<void> {
    try {
      this.logger.info(chalk.bold.green('Starting Mullvad Server Ping Tester...'));

      // Получаем список серверов
      this.logger.info('Fetching server list...');
      const servers = await this.serverFetcherService.fetchServers();

      if (servers.length === 0) {
        this.logger.error('No servers found. Exiting...');
        process.exit(1);
      }

      this.logger.info(`Found ${servers.length} servers matching criteria`);

      // Пингуем серверы
      this.logger.info('Pinging servers...');
      const pingResults = await this.pingService.pingAllServers(servers);

      // Генерируем статистику
      this.logger.info('Generating statistics...');
      const stats = this.outputGeneratorService.generateStatistics(pingResults);

      // Выводим результаты
      this.outputGeneratorService.printResults(pingResults, stats, {
        format: 'console',
        topCount: config.TOP_SERVERS_COUNT,
        verbose: this.isVerboseMode
      });

      // Сохраняем результаты
      this.logger.info('Saving results...');
      await this.outputGeneratorService.saveResults(pingResults, stats, {
        format: config.SAVE_FORMATS[0] as 'json' | 'html' | 'csv',
        outputPath: config.SAVE_PATH,
        topCount: config.TOP_SERVERS_COUNT
      });

      // Анализируем историю, если доступна
      let historicalData: IHistoricalData[] = [];
      try {
        this.logger.info('Analyzing historical data...');
        historicalData = await this.historyAnalyzerService.loadHistory();
        
        if (historicalData.length > 0) {
          const trends = this.historyAnalyzerService.analyzePerformanceTrends(historicalData);
          const stableServers = this.historyAnalyzerService.findMostStableServers(historicalData);
          
          this.logger.info('Historical analysis complete');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn('Could not analyze historical data:', errorMessage);
      }

      // Запускаем веб-сервер, если включен
      if (config.WEB_SERVER.ENABLED) {
        this.logger.info(`Starting web server on ${config.WEB_SERVER.HOST}:${config.WEB_SERVER.PORT}...`);
        await this.webServerService.start(config.WEB_SERVER.PORT);
        
        // Обновляем данные на веб-сервере
        this.webServerService.updateData(pingResults, stats, historicalData);
        
        this.logger.info(chalk.green(`Web server running at http://${config.WEB_SERVER.HOST}:${config.WEB_SERVER.PORT}`));
        this.logger.info('Press Ctrl+C to stop');
      } else {
        this.logger.info(chalk.green('All done!'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error during application execution:', errorMessage);
      process.exit(1);
    }
  }
}

// Запускаем приложение
const app = new Application();
app.run().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 