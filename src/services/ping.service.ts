import { injectable } from 'inversify';
import ping from 'ping';
import os from 'os';
import pLimit from 'p-limit';

import config from '@/config/config';
import { IMullvadServer, IPingResult } from '@/interfaces/server.interface';
import { IPingService } from '@/interfaces/services.interface';
import { Logger } from '@/utils/logger';

/**
 * Тип для результата пинга от библиотеки ping
 */
interface IPingProbeResult {
  host: string;
  alive: boolean;
  time: string;
  min: string;
  max: string;
  avg: string;
  stddev: string;
  packetLoss: string;
  output: string;
}

/**
 * Сервис для пингования серверов
 * @implements {IPingService}
 */
@injectable()
export class PingService implements IPingService {
  private readonly logger = new Logger(PingService.name);

  /**
   * Пингует один сервер с механизмом повторных попыток
   * @param {IMullvadServer} server - Сервер для пингования
   * @param {number} retryCount - Количество оставшихся попыток
   * @returns {Promise<IPingResult>} - Промис с результатом пинга
   */
  public async pingServer(server: IMullvadServer, retryCount = config.PING_RETRIES): Promise<IPingResult> {
    try {
      // Определяем IP-адрес сервера
      // Проверяем разные возможные поля, так как формат API может меняться
      const serverIP = server.ipv4_addr_in || 
                       (server as unknown as Record<string, string>).ipv4_address || 
                       (server as unknown as Record<string, string>).ip_address || 
                       (server as unknown as Record<string, string>).ip || 
                       (server as unknown as Record<string, string>).address;

      if (!serverIP) {
        this.logger.error(`Не удалось определить IP-адрес для сервера ${server.hostname}`);
        this.logger.debug('Доступные поля сервера:', Object.keys(server));
        return this.createUnreachableResult(server);
      }

      // Настраиваем параметры ping в зависимости от ОС
      const isWindows = os.platform() === 'win32';
      const pingOptions = {
        timeout: config.PING_TIMEOUT / 1000, // Конвертируем мс в секунды
        // Используем разные параметры для Windows и других ОС
        // Уменьшаем количество пакетов для ускорения
        extra: isWindows ? ['-n', '2'] : ['-c', '2'],
      };

      // Выполняем ping
      const result = await ping.promise.probe(serverIP, pingOptions) as IPingProbeResult;

      // Обрабатываем результат
      if (result.alive) {
        // Рассчитываем статистику
        const pingTime = parseFloat(result.time);
        const packetLoss = parseFloat(result.packetLoss);

        return {
          hostname: server.hostname,
          country_code: server.country_code,
          country: server.country_name,
          city: server.city_name,
          ip: serverIP,
          ping: pingTime,
          packetLoss: packetLoss,
          min: parseFloat(result.min) || pingTime,
          max: parseFloat(result.max) || pingTime,
          avg: parseFloat(result.avg) || pingTime,
          stddev: parseFloat(result.stddev) || 0,
          timestamp: new Date().toISOString(),
          status: this.getPingStatus(pingTime),
          server: server
        };
      } else if (retryCount > 0) {
        // Повторяем попытку, если сервер недоступен
        this.logger.debug(`Server ${server.hostname} (${serverIP}) unreachable, retrying... (${retryCount} attempts left)`);
        return this.pingServer(server, retryCount - 1);
      } else {
        // Сервер недоступен после всех попыток
        this.logger.debug(`Server ${server.hostname} (${serverIP}) unreachable after all attempts`);
        return this.createUnreachableResult(server);
      }
    } catch (error) {
      if (retryCount > 0) {
        // Повторяем попытку при ошибке
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.debug(`Error pinging ${server.hostname}: ${errorMessage}, retrying... (${retryCount} attempts left)`);
        return this.pingServer(server, retryCount - 1);
      } else {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error pinging ${server.hostname} (${server.ipv4_addr_in || 'unknown IP'}):`, errorMessage);
        return this.createUnreachableResult(server);
      }
    }
  }

  /**
   * Создает объект результата для недоступных серверов
   * @param {IMullvadServer} server - Объект сервера
   * @returns {IPingResult} - Объект сервера с статусом недоступности
   */
  private createUnreachableResult(server: IMullvadServer): IPingResult {
    return {
      hostname: server.hostname,
      country_code: server.country_code,
      country: server.country_name,
      city: server.city_name,
      ip: server.ipv4_addr_in || 
          (server as unknown as Record<string, string>).ipv4_address || 
          (server as unknown as Record<string, string>).ip_address || 
          (server as unknown as Record<string, string>).ip || 
          (server as unknown as Record<string, string>).address || 
          'unknown IP',
      ping: null,
      packetLoss: 100,
      min: 9999,
      max: 9999,
      avg: 9999,
      stddev: 0,
      timestamp: new Date().toISOString(),
      status: 'unreachable',
      server: server
    };
  }

  /**
   * Определяет статус пинга на основе порогов
   * @param {number} pingTime - Время пинга в мс
   * @returns {string} - Статус: 'good', 'medium', или 'bad'
   */
  public getPingStatus(pingTime: number): 'good' | 'medium' | 'bad' {
    if (pingTime < config.PING_THRESHOLDS.GOOD) return 'good';
    if (pingTime < config.PING_THRESHOLDS.MEDIUM) return 'medium';
    return 'bad';
  }

  /**
   * Пингует все серверы с ограничением параллельности
   * @param {IMullvadServer[]} servers - Массив серверов для пингования
   * @returns {Promise<IPingResult[]>} - Промис с массивом результатов пинга
   */
  public async pingAllServers(servers: IMullvadServer[]): Promise<IPingResult[]> {
    // Определяем оптимальное количество параллельных операций
    const cpuCount = os.cpus().length;
    const maxThreads = config.MAX_THREADS > 0 ? config.MAX_THREADS : cpuCount * 2;
    const concurrency = Math.min(config.CONCURRENT_PINGS, maxThreads);

    this.logger.info(`Using ${concurrency} concurrent connections (${cpuCount} CPU cores detected)`);

    // Создаем ограничитель параллельности
    const limit = pLimit(concurrency);

    // Создаем переменные для отслеживания прогресса
    const total = servers.length;
    let completed = 0;
    let successful = 0;
    let failed = 0;

    // Функция обновления прогресса
    const updateProgress = (result: IPingResult): IPingResult => {
      completed++;
      if (result.ping !== null && result.ping < 9999) successful++;
      else failed++;

      const percent = Math.floor((completed / total) * 100);
      const progressBar = '[' + '='.repeat(Math.floor(percent / 2)) + ' '.repeat(50 - Math.floor(percent / 2)) + ']';

      process.stdout.write(`\r${progressBar} ${percent}% | ${completed}/${total} | ✓ ${successful} | ✗ ${failed}`);

      return result;
    };

    // Создаем задачи пинга с отслеживанием прогресса
    const tasks = servers.map(server =>
      limit(() => this.pingServer(server).then(updateProgress)),
    );

    // Выполняем все задачи пинга
    const results = await Promise.all(tasks);

    // Очищаем строку прогресса и выводим итоги
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    this.logger.info(`Completed pinging ${total} servers: ${successful} reachable, ${failed} unreachable`);

    return results;
  }
} 