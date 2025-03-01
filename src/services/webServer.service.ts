import { injectable } from 'inversify';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { IPingResult, IPingStatistics, IHistoricalData } from '@/interfaces/server.interface';
import { IWebServerService } from '@/interfaces/services.interface';
import { Logger } from '@/utils/logger';
import config from '@/config/config';

@injectable()
export class WebServerService implements IWebServerService {
  private logger = new Logger('WebServerService');
  private app: express.Application;
  private server: http.Server | null = null;
  private io: SocketIOServer | null = null;
  private data: {
    results: IPingResult[];
    statistics: IPingStatistics;
    history: IHistoricalData[];
    lastUpdate: string;
  };

  constructor() {
    this.app = express();
    this.data = {
      results: [],
      statistics: {} as IPingStatistics,
      history: [],
      lastUpdate: new Date().toISOString()
    };
    
    this.setupExpress();
  }

  /**
   * Запускает веб-сервер
   * @param port Порт для запуска сервера
   */
  public async start(port = config.WEB_SERVER.PORT): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(this.app);
      this.io = new SocketIOServer(this.server);
      
      this.setupSocketIO();
      
      this.server.listen(port, () => {
        this.logger.info(`Web server started on port ${port}`);
        resolve();
      });
    });
  }

  /**
   * Останавливает веб-сервер
   */
  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        this.logger.warn('Web server is not running');
        resolve();
        return;
      }
      
      this.server.close((err) => {
        if (err) {
          this.logger.error(`Failed to stop web server: ${err.message}`);
          reject(err);
          return;
        }
        
        this.logger.info('Web server stopped');
        this.server = null;
        this.io = null;
        resolve();
      });
    });
  }

  /**
   * Обновляет данные на веб-сервере
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param history Исторические данные
   */
  public updateData(
    results: IPingResult[], 
    statistics: IPingStatistics, 
    history?: IHistoricalData[]
  ): void {
    this.data.results = results;
    this.data.statistics = statistics;
    this.data.lastUpdate = new Date().toISOString();
    
    if (history) {
      this.data.history = history;
    }
    
    if (this.io) {
      this.io.emit('data-update', {
        results: this.data.results,
        statistics: this.data.statistics,
        lastUpdate: this.data.lastUpdate
      });
      
      this.logger.debug('Data updated and sent to clients');
    }
  }

  /**
   * Настраивает Express
   */
  private setupExpress(): void {
    // Статические файлы
    const publicPath = path.join(process.cwd(), 'public');
    this.app.use(express.static(publicPath));
    
    // API маршруты
    this.app.get('/api/results', (req: express.Request, res: express.Response) => {
      res.json({
        results: this.data.results,
        statistics: this.data.statistics,
        lastUpdate: this.data.lastUpdate
      });
    });
    
    this.app.get('/api/history', (req: express.Request, res: express.Response) => {
      res.json({
        history: this.data.history
      });
    });
    
    // Маршрут для всех остальных запросов (SPA)
    this.app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  /**
   * Настраивает Socket.IO
   */
  private setupSocketIO(): void {
    if (!this.io) return;
    
    this.io.on('connection', (socket: any) => {
      this.logger.debug(`Client connected: ${socket.id}`);
      
      // Отправляем текущие данные новому клиенту
      socket.emit('data-update', {
        results: this.data.results,
        statistics: this.data.statistics,
        lastUpdate: this.data.lastUpdate
      });
      
      socket.on('disconnect', () => {
        this.logger.debug(`Client disconnected: ${socket.id}`);
      });
    });
  }
} 