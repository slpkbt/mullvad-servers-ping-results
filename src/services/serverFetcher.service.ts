import { injectable } from 'inversify';
import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';

import config from '@/config/config';
import { IMullvadServer } from '@/interfaces/server.interface';
import { IServerFetcherService } from '@/interfaces/services.interface';
import { Logger } from '@/utils/logger';

/**
 * Сервис для получения списка серверов Mullvad
 * @implements {IServerFetcherService}
 */
@injectable()
export class ServerFetcherService implements IServerFetcherService {
  private readonly logger = new Logger(ServerFetcherService.name);

  /**
   * Получает список серверов от API Mullvad с механизмом повторных попыток
   * @param {number} retries - Количество повторных попыток в случае неудачи
   * @returns {Promise<IMullvadServer[]>} - Промис с массивом серверов
   */
  public async fetchServersFromAPI(retries = 3): Promise<IMullvadServer[]> {
    try {
      this.logger.info(`Fetching servers from ${config.API_URL}...`);
      
      const response: AxiosResponse<IMullvadServer[]> = await axios.get(config.API_URL, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mullvad-Server-Ping-Tester/1.0',
        },
      });

      if (response.status !== 200) {
        throw new Error(`API returned status code ${response.status}`);
      }

      this.logger.info(`Successfully fetched ${response.data.length} servers`);

      // Добавляем отладочную информацию о структуре данных
      if (response.data.length > 0) {
        this.logger.debug('Server data structure:', Object.keys(response.data[0]));
        this.logger.debug('First server example:', JSON.stringify(response.data[0], null, 2));
      }

      return response.data;
    } catch (error) {
      if (retries > 0) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Error fetching servers: ${errorMessage}. Retrying... (${retries} attempts left)`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchServersFromAPI(retries - 1);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to fetch servers after multiple attempts:', errorMessage);

      // Пробуем загрузить из кэша как запасной вариант
      try {
        return await this.loadServersFromCache();
      } catch (cacheError) {
        const cacheErrorMessage = cacheError instanceof Error ? cacheError.message : String(cacheError);
        this.logger.error('Could not load servers from cache:', cacheErrorMessage);
        return [];
      }
    }
  }

  /**
   * Сохраняет серверы в кэш-файл
   * @param {IMullvadServer[]} servers - Массив серверов для сохранения
   * @returns {Promise<void>}
   */
  public async saveServersToCache(servers: IMullvadServer[]): Promise<void> {
    try {
      const cacheDir = path.join(config.SAVE_PATH, '.cache');
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(
        path.join(cacheDir, 'servers.json'),
        JSON.stringify(servers, null, 2),
      );
      this.logger.debug(`Saved ${servers.length} servers to cache`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error saving servers to cache:', errorMessage);
    }
  }

  /**
   * Загружает серверы из кэш-файла
   * @returns {Promise<IMullvadServer[]>} - Промис с массивом серверов из кэша
   */
  public async loadServersFromCache(): Promise<IMullvadServer[]> {
    try {
      const cacheFile = path.join(config.SAVE_PATH, '.cache', 'servers.json');
      const data = await fs.readFile(cacheFile, 'utf8');
      const servers = JSON.parse(data) as IMullvadServer[];
      this.logger.info(`Loaded ${servers.length} servers from cache`);
      return servers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`No cached servers available: ${errorMessage}`);
    }
  }

  /**
   * Фильтрует серверы на основе фильтров по стране и городу
   * @param {IMullvadServer[]} servers - Массив серверов для фильтрации
   * @returns {IMullvadServer[]} - Отфильтрованный массив серверов
   */
  public filterServers(servers: IMullvadServer[]): IMullvadServer[] {
    let filteredServers = [...servers];

    // Фильтруем по стране, если указано
    if (config.COUNTRY_FILTER) {
      const countries = config.COUNTRY_FILTER.split(',').map(c => c.trim().toUpperCase());
      filteredServers = filteredServers.filter(server =>
        countries.includes(server.country_code.toUpperCase()),
      );
      this.logger.info(`Filtered to ${filteredServers.length} servers in countries: ${config.COUNTRY_FILTER}`);
    }

    // Фильтруем по городу, если указано
    if (config.CITY_FILTER) {
      const cities = config.CITY_FILTER.split(',').map(c => c.trim().toLowerCase());
      filteredServers = filteredServers.filter(server =>
        cities.some(city => server.city_name.toLowerCase().includes(city)),
      );
      this.logger.info(`Filtered to ${filteredServers.length} servers in cities: ${config.CITY_FILTER}`);
    }

    return filteredServers;
  }

  /**
   * Основная функция для получения и фильтрации серверов
   * @returns {Promise<IMullvadServer[]>} - Промис с массивом отфильтрованных серверов
   */
  public async fetchServers(): Promise<IMullvadServer[]> {
    try {
      // Получаем серверы от API
      const servers = await this.fetchServersFromAPI();

      // Сохраняем в кэш для будущего использования
      if (servers.length > 0) {
        await this.saveServersToCache(servers);
      }

      // Применяем фильтры
      const filteredServers = this.filterServers(servers);

      if (filteredServers.length === 0) {
        this.logger.warn('No servers match the specified filters!');
      }

      return filteredServers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error in fetchServers:', errorMessage);
      return [];
    }
  }
} 