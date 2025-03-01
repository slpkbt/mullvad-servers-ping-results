import { injectable } from 'inversify';
import fs from 'fs/promises';
import path from 'path';
import { IPingResult, IPingStatistics, IHistoricalData } from '@/interfaces/server.interface';
import { IHistoryAnalyzerService } from '@/interfaces/services.interface';
import { Logger } from '@/utils/logger';
import config from '@/config/config';

interface IServerTrend {
  hostname: string;
  country: string;
  city: string;
  pingHistory: (number | null)[];
  averagePing: number;
  standardDeviation: number;
  trend: 'improving' | 'stable' | 'degrading' | 'unknown';
  reachabilityRate: number;
}

interface IPerformanceTrends {
  overallTrend: 'improving' | 'stable' | 'degrading' | 'unknown';
  averagePingTrend: number[];
  reachabilityTrend: number[];
  serverTrends: IServerTrend[];
  timeframe: string[];
}

@injectable()
export class HistoryAnalyzerService implements IHistoryAnalyzerService {
  private logger = new Logger('HistoryAnalyzerService');
  private historyPath: string;

  constructor() {
    this.historyPath = path.join(process.cwd(), 'history');
  }

  /**
   * Сохраняет текущие результаты в историю
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   */
  public async saveToHistory(
    results: IPingResult[], 
    statistics: IPingStatistics
  ): Promise<void> {
    try {
      // Создаем директорию истории, если она не существует
      await fs.mkdir(this.historyPath, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const historyFile = path.join(this.historyPath, `history_${timestamp}.json`);
      
      const historyData: IHistoricalData = {
        date: new Date().toISOString(),
        results,
        statistics
      };
      
      await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2), 'utf8');
      this.logger.info(`History saved to ${historyFile}`);
      
      // Очищаем старые файлы истории, если их слишком много
      await this.cleanupOldHistoryFiles();
    } catch (error) {
      this.logger.error(`Failed to save history: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Загружает исторические данные
   */
  public async loadHistory(): Promise<IHistoricalData[]> {
    try {
      // Создаем директорию истории, если она не существует
      await fs.mkdir(this.historyPath, { recursive: true });
      
      const files = await fs.readdir(this.historyPath);
      const historyFiles = files
        .filter(file => file.startsWith('history_') && file.endsWith('.json'))
        .sort(); // Сортируем по имени файла (которое содержит временную метку)
      
      const historyData: IHistoricalData[] = [];
      
      for (const file of historyFiles) {
        try {
          const filePath = path.join(this.historyPath, file);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(fileContent) as IHistoricalData;
          historyData.push(data);
        } catch (error) {
          this.logger.warn(`Failed to parse history file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      this.logger.info(`Loaded ${historyData.length} history records`);
      return historyData;
    } catch (error) {
      this.logger.error(`Failed to load history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Анализирует изменения в производительности серверов
   * @param history Исторические данные
   */
  public analyzePerformanceTrends(history: IHistoricalData[]): IPerformanceTrends {
    if (history.length < 2) {
      this.logger.warn('Not enough history data for trend analysis');
      return {
        overallTrend: 'unknown',
        averagePingTrend: [],
        reachabilityTrend: [],
        serverTrends: [],
        timeframe: []
      };
    }
    
    // Сортируем историю по дате
    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Извлекаем временные метки для графиков
    const timeframe = sortedHistory.map(h => {
      const date = new Date(h.date);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    });
    
    // Анализируем тренды средних значений пинга
    const averagePingTrend = sortedHistory.map(h => h.statistics.averagePing);
    
    // Анализируем тренды доступности
    const reachabilityTrend = sortedHistory.map(h => 
      h.statistics.reachableServers / h.statistics.totalServers * 100
    );
    
    // Анализируем тренды для отдельных серверов
    const serverMap = new Map<string, IServerTrend>();
    
    // Инициализируем данные для каждого сервера
    for (const historyItem of sortedHistory) {
      for (const result of historyItem.results) {
        const { hostname } = result.server;
        
        if (!serverMap.has(hostname)) {
          serverMap.set(hostname, {
            hostname,
            country: result.server.country_name,
            city: result.server.city_name,
            pingHistory: new Array(sortedHistory.length).fill(null),
            averagePing: 0,
            standardDeviation: 0,
            trend: 'unknown',
            reachabilityRate: 0
          });
        }
      }
    }
    
    // Заполняем историю пингов для каждого сервера
    sortedHistory.forEach((historyItem, historyIndex) => {
      for (const result of historyItem.results) {
        const { hostname } = result.server;
        const serverData = serverMap.get(hostname);
        
        if (serverData) {
          serverData.pingHistory[historyIndex] = result.ping;
        }
      }
    });
    
    // Вычисляем статистику для каждого сервера
    for (const serverData of serverMap.values()) {
      const validPings = serverData.pingHistory.filter(p => p !== null) as number[];
      
      // Вычисляем среднее значение пинга
      serverData.averagePing = validPings.length > 0
        ? Math.round(validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length)
        : 0;
      
      // Вычисляем стандартное отклонение
      if (validPings.length > 1) {
        const variance = validPings.reduce((sum, ping) => 
          sum + Math.pow(ping - serverData.averagePing, 2), 0) / validPings.length;
        serverData.standardDeviation = Math.round(Math.sqrt(variance));
      }
      
      // Вычисляем процент доступности
      serverData.reachabilityRate = serverData.pingHistory.length > 0
        ? (validPings.length / serverData.pingHistory.length) * 100
        : 0;
      
      // Определяем тренд
      if (validPings.length >= 2) {
        const firstHalf = validPings.slice(0, Math.floor(validPings.length / 2));
        const secondHalf = validPings.slice(Math.floor(validPings.length / 2));
        
        const firstHalfAvg = firstHalf.reduce((sum, ping) => sum + ping, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, ping) => sum + ping, 0) / secondHalf.length;
        
        const difference = firstHalfAvg - secondHalfAvg;
        
        if (Math.abs(difference) < 5) {
          serverData.trend = 'stable';
        } else if (difference > 0) {
          serverData.trend = 'improving'; // Пинг уменьшается
        } else {
          serverData.trend = 'degrading'; // Пинг увеличивается
        }
      }
    }
    
    // Преобразуем Map в массив и сортируем по среднему пингу
    const serverTrends = Array.from(serverMap.values())
      .sort((a, b) => a.averagePing - b.averagePing);
    
    // Определяем общий тренд
    let overallTrend: 'improving' | 'stable' | 'degrading' | 'unknown' = 'unknown';
    
    if (averagePingTrend.length >= 2) {
      const firstHalf = averagePingTrend.slice(0, Math.floor(averagePingTrend.length / 2));
      const secondHalf = averagePingTrend.slice(Math.floor(averagePingTrend.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, ping) => sum + ping, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, ping) => sum + ping, 0) / secondHalf.length;
      
      const difference = firstHalfAvg - secondHalfAvg;
      
      if (Math.abs(difference) < 5) {
        overallTrend = 'stable';
      } else if (difference > 0) {
        overallTrend = 'improving'; // Пинг уменьшается
      } else {
        overallTrend = 'degrading'; // Пинг увеличивается
      }
    }
    
    return {
      overallTrend,
      averagePingTrend,
      reachabilityTrend,
      serverTrends,
      timeframe
    };
  }

  /**
   * Находит наиболее стабильные серверы
   * @param history Исторические данные
   * @param count Количество серверов для вывода
   */
  public findMostStableServers(history: IHistoricalData[], count = 10): IServerTrend[] {
    const trends = this.analyzePerformanceTrends(history);
    
    // Сортируем серверы по стабильности (низкое стандартное отклонение и высокая доступность)
    return trends.serverTrends
      .filter(server => server.reachabilityRate > 80) // Минимум 80% доступности
      .sort((a, b) => {
        // Сначала сортируем по доступности
        if (Math.abs(a.reachabilityRate - b.reachabilityRate) > 10) {
          return b.reachabilityRate - a.reachabilityRate;
        }
        
        // Затем по стандартному отклонению (меньше = стабильнее)
        if (a.standardDeviation !== b.standardDeviation) {
          return a.standardDeviation - b.standardDeviation;
        }
        
        // Наконец, по среднему пингу
        return a.averagePing - b.averagePing;
      })
      .slice(0, count);
  }

  /**
   * Очищает старые файлы истории
   */
  private async cleanupOldHistoryFiles(): Promise<void> {
    try {
      const maxHistoryFiles = config.MAX_HISTORY_FILES || 100;
      
      const files = await fs.readdir(this.historyPath);
      const historyFiles = files
        .filter(file => file.startsWith('history_') && file.endsWith('.json'))
        .sort(); // Сортируем по имени файла (которое содержит временную метку)
      
      if (historyFiles.length > maxHistoryFiles) {
        const filesToDelete = historyFiles.slice(0, historyFiles.length - maxHistoryFiles);
        
        for (const file of filesToDelete) {
          const filePath = path.join(this.historyPath, file);
          await fs.unlink(filePath);
          this.logger.debug(`Deleted old history file: ${file}`);
        }
        
        this.logger.info(`Cleaned up ${filesToDelete.length} old history files`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup old history files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 