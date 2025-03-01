import { injectable } from 'inversify';
import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import chalk from 'chalk';
import { IPingResult, IPingStatistics, IOutputOptions } from '@/interfaces/server.interface';
import { IOutputGeneratorService } from '@/interfaces/services.interface';
import { Logger } from '@/utils/logger';

@injectable()
export class OutputGeneratorService implements IOutputGeneratorService {
  private logger = new Logger('OutputGeneratorService');

  /**
   * Генерирует статистику по результатам пинга
   * @param results Результаты пинга
   */
  public generateStatistics(results: IPingResult[]): IPingStatistics {
    this.logger.debug(`Generating statistics for ${results.length} ping results`);
    
    const reachableResults = results.filter(r => r.ping !== null);
    const unreachableResults = results.filter(r => r.ping === null);
    
    const goodResults = results.filter(r => r.status === 'good');
    const mediumResults = results.filter(r => r.status === 'medium');
    const badResults = results.filter(r => r.status === 'bad');
    
    const totalPing = reachableResults.reduce((sum, r) => sum + (r.ping || 0), 0);
    const averagePing = reachableResults.length > 0 
      ? Math.round(totalPing / reachableResults.length) 
      : 0;
    
    // Сортируем по пингу (null значения в конец)
    const sortedResults = [...results].sort((a, b) => {
      if (a.ping === null) return 1;
      if (b.ping === null) return -1;
      return a.ping - b.ping;
    });
    
    const statistics: IPingStatistics = {
      totalServers: results.length,
      reachableServers: reachableResults.length,
      unreachableServers: unreachableResults.length,
      averagePing,
      goodServers: goodResults.length,
      mediumServers: mediumResults.length,
      badServers: badResults.length,
      bestServer: sortedResults[0],
      worstServer: reachableResults.length > 0 
        ? reachableResults[reachableResults.length - 1] 
        : undefined,
      timestamp: new Date().toISOString(),
      duration: 0 // Будет установлено извне
    };
    
    this.logger.debug('Statistics generated successfully');
    return statistics;
  }

  /**
   * Сохраняет результаты в файл
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param options Опции вывода
   */
  public async saveResults(
    results: IPingResult[], 
    statistics: IPingStatistics, 
    options: IOutputOptions
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const outputDir = options.outputPath || './results';
    
    // Создаем директорию, если она не существует
    await fs.mkdir(outputDir, { recursive: true });
    
    // Ограничиваем результаты, если указано
    const limitedResults = options.topCount && options.topCount > 0
      ? [...results]
        .sort((a, b) => {
          if (a.ping === null) return 1;
          if (b.ping === null) return -1;
          return a.ping - b.ping;
        })
        .slice(0, options.topCount)
      : results;
    
    // Формируем имя файла
    const baseFilename = `ping_results_${timestamp}`;
    let outputPath = '';
    
    switch (options.format) {
      case 'json':
        outputPath = path.join(outputDir, `${baseFilename}.json`);
        await this.saveAsJson(outputPath, limitedResults, statistics);
        break;
        
      case 'csv':
        outputPath = path.join(outputDir, `${baseFilename}.csv`);
        await this.saveAsCsv(outputPath, limitedResults);
        break;
        
      case 'html':
        outputPath = path.join(outputDir, `${baseFilename}.html`);
        await this.saveAsHtml(outputPath, limitedResults, statistics);
        break;
        
      default:
        this.logger.warn(`Unsupported output format: ${options.format}, defaulting to JSON`);
        outputPath = path.join(outputDir, `${baseFilename}.json`);
        await this.saveAsJson(outputPath, limitedResults, statistics);
    }
    
    this.logger.info(`Results saved to ${outputPath}`);
    return outputPath;
  }

  /**
   * Выводит результаты в консоль
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @param options Опции вывода
   */
  public printResults(
    results: IPingResult[], 
    statistics: IPingStatistics, 
    options: IOutputOptions
  ): void {
    // Выводим статистику
    console.log('\n' + chalk.bold.blue('===== Ping Statistics ====='));
    console.log(chalk.bold('Total servers:'), statistics.totalServers);
    console.log(chalk.bold('Reachable servers:'), statistics.reachableServers);
    console.log(chalk.bold('Unreachable servers:'), statistics.unreachableServers);
    console.log(chalk.bold('Average ping:'), `${statistics.averagePing}ms`);
    console.log(chalk.bold('Good servers:'), chalk.green(statistics.goodServers));
    console.log(chalk.bold('Medium servers:'), chalk.yellow(statistics.mediumServers));
    console.log(chalk.bold('Bad servers:'), chalk.red(statistics.badServers));
    
    if (statistics.bestServer) {
      console.log(
        chalk.bold('\nBest server:'), 
        chalk.green(`${statistics.bestServer.server.hostname} (${statistics.bestServer.server.city_name}, ${statistics.bestServer.server.country_name}) - ${statistics.bestServer.ping}ms`)
      );
    }
    
    // Выводим топ серверов
    const topCount = options.topCount || 10;
    const sortedResults = [...results]
      .sort((a, b) => {
        if (a.ping === null) return 1;
        if (b.ping === null) return -1;
        return a.ping - b.ping;
      })
      .slice(0, topCount);
    
    console.log(chalk.bold.blue(`\n===== Top ${topCount} Servers =====`));
    
    sortedResults.forEach((result, index) => {
      const { server, ping, status } = result;
      let statusColor;
      
      switch (status) {
        case 'good': statusColor = chalk.green; break;
        case 'medium': statusColor = chalk.yellow; break;
        case 'bad': statusColor = chalk.red; break;
        case 'unreachable': statusColor = chalk.gray; break;
        default: statusColor = chalk.white;
      }
      
      console.log(
        chalk.bold(`${index + 1}.`),
        statusColor(`${server.hostname} (${server.city_name}, ${server.country_name}) - ${ping !== null ? ping + 'ms' : 'Unreachable'}`)
      );
      
      // Выводим дополнительную информацию в verbose режиме
      if (options.verbose) {
        console.log(
          '   ',
          chalk.dim(`Provider: ${server.provider}, Active: ${server.active}, Owned: ${server.owned}`)
        );
      }
    });
    
    console.log(chalk.bold.blue('\n===== End of Report =====\n'));
  }

  /**
   * Генерирует HTML-отчет
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @returns HTML-строка с отчетом
   */
  public generateHtmlReport(results: IPingResult[], statistics: IPingStatistics): string {
    const sortedResults = [...results].sort((a, b) => {
      if (a.ping === null) return 1;
      if (b.ping === null) return -1;
      return a.ping - b.ping;
    });
    
    const getStatusClass = (status: string): string => {
      switch (status) {
        case 'good': return 'good';
        case 'medium': return 'medium';
        case 'bad': return 'bad';
        case 'unreachable': return 'unreachable';
        default: return '';
      }
    };
    
    const resultsHtml = sortedResults.map(result => `
      <tr class="${getStatusClass(result.status)}">
        <td>${result.server.hostname}</td>
        <td>${result.server.country_name}</td>
        <td>${result.server.city_name}</td>
        <td>${result.ping !== null ? result.ping + ' ms' : 'Unreachable'}</td>
        <td>${result.status}</td>
        <td>${result.server.provider}</td>
        <td>${result.server.active ? 'Yes' : 'No'}</td>
        <td>${result.server.owned ? 'Yes' : 'No'}</td>
      </tr>
    `).join('');
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mullvad Server Ping Results</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2 {
            color: #1a5276;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px 15px;
            border-bottom: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #1a5276;
            color: white;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
          }
          .good { background-color: rgba(76, 175, 80, 0.1); }
          .medium { background-color: rgba(255, 193, 7, 0.1); }
          .bad { background-color: rgba(244, 67, 54, 0.1); }
          .unreachable { background-color: rgba(158, 158, 158, 0.1); }
          .timestamp {
            text-align: right;
            color: #666;
            font-style: italic;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <h1>Mullvad Server Ping Results</h1>
        
        <div class="stats">
          <div class="stat-card">
            <h3>Total Servers</h3>
            <div class="stat-value">${statistics.totalServers}</div>
          </div>
          <div class="stat-card">
            <h3>Reachable Servers</h3>
            <div class="stat-value">${statistics.reachableServers}</div>
          </div>
          <div class="stat-card">
            <h3>Unreachable Servers</h3>
            <div class="stat-value">${statistics.unreachableServers}</div>
          </div>
          <div class="stat-card">
            <h3>Average Ping</h3>
            <div class="stat-value">${statistics.averagePing} ms</div>
          </div>
          <div class="stat-card">
            <h3>Good Servers</h3>
            <div class="stat-value">${statistics.goodServers}</div>
          </div>
          <div class="stat-card">
            <h3>Medium Servers</h3>
            <div class="stat-value">${statistics.mediumServers}</div>
          </div>
          <div class="stat-card">
            <h3>Bad Servers</h3>
            <div class="stat-value">${statistics.badServers}</div>
          </div>
        </div>
        
        <h2>Best Server</h2>
        <p>
          ${statistics.bestServer 
            ? `${statistics.bestServer.server.hostname} (${statistics.bestServer.server.city_name}, ${statistics.bestServer.server.country_name}) - ${statistics.bestServer.ping} ms` 
            : 'No reachable servers found'}
        </p>
        
        <h2>Server List</h2>
        <table>
          <thead>
            <tr>
              <th>Hostname</th>
              <th>Country</th>
              <th>City</th>
              <th>Ping</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Active</th>
              <th>Owned</th>
            </tr>
          </thead>
          <tbody>
            ${resultsHtml}
          </tbody>
        </table>
        
        <div class="timestamp">
          Generated on ${new Date(statistics.timestamp).toLocaleString()}
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Генерирует JSON-отчет
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   * @returns JSON-строка с отчетом
   */
  public generateJsonReport(results: IPingResult[], statistics: IPingStatistics): string {
    const data = {
      results,
      statistics,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Генерирует CSV-отчет
   * @param results Результаты пинга
   * @returns CSV-строка с отчетом
   */
  public generateCsvReport(results: IPingResult[]): string {
    const header = 'Hostname,Country,City,Ping (ms),Status,Provider,Active,Owned,Timestamp\n';
    
    const rows = results.map(result => {
      return [
        result.server.hostname,
        result.server.country_name,
        result.server.city_name,
        result.ping !== null ? result.ping : 'Unreachable',
        result.status,
        result.server.provider,
        result.server.active ? 'Yes' : 'No',
        result.server.owned ? 'Yes' : 'No',
        result.timestamp
      ].join(',');
    }).join('\n');
    
    return header + rows;
  }

  /**
   * Сохраняет результаты в JSON формате
   * @param filePath Путь к файлу
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   */
  private async saveAsJson(
    filePath: string, 
    results: IPingResult[], 
    statistics: IPingStatistics
  ): Promise<void> {
    const data = {
      results,
      statistics,
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Сохраняет результаты в CSV формате
   * @param filePath Путь к файлу
   * @param results Результаты пинга
   */
  private async saveAsCsv(filePath: string, results: IPingResult[]): Promise<void> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'hostname', title: 'Hostname' },
        { id: 'country', title: 'Country' },
        { id: 'city', title: 'City' },
        { id: 'ping', title: 'Ping (ms)' },
        { id: 'status', title: 'Status' },
        { id: 'provider', title: 'Provider' },
        { id: 'active', title: 'Active' },
        { id: 'owned', title: 'Owned' },
        { id: 'timestamp', title: 'Timestamp' }
      ]
    });
    
    const records = results.map(result => ({
      hostname: result.server.hostname,
      country: result.server.country_name,
      city: result.server.city_name,
      ping: result.ping !== null ? result.ping : 'Unreachable',
      status: result.status,
      provider: result.server.provider,
      active: result.server.active,
      owned: result.server.owned,
      timestamp: result.timestamp
    }));
    
    await csvWriter.writeRecords(records);
  }

  /**
   * Сохраняет результаты в HTML формате
   * @param filePath Путь к файлу
   * @param results Результаты пинга
   * @param statistics Статистика пинга
   */
  private async saveAsHtml(
    filePath: string, 
    results: IPingResult[], 
    statistics: IPingStatistics
  ): Promise<void> {
    const html = this.generateHtmlReport(results, statistics);
    await fs.writeFile(filePath, html, 'utf8');
  }
} 