import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { ServerFetcherService } from '../serverFetcher.service';
import { IMullvadServer } from '../../interfaces/server.interface';

// Мокаем зависимости
jest.mock('axios');
jest.mock('fs/promises');
jest.mock('@/utils/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  ELogLevel: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },
}));

describe('ServerFetcherService', () => {
  let service: ServerFetcherService;
  const mockServers: IMullvadServer[] = [
    {
      hostname: 'se-sto-wg-001',
      country_code: 'SE',
      country_name: 'Sweden',
      city_code: 'STO',
      city_name: 'Stockholm',
      active: true,
      owned: true,
      provider: 'Mullvad',
      ipv4_addr_in: '1.2.3.4',
      public_key: 'abc123',
      multihop_port: 1234
    },
    {
      hostname: 'de-fra-wg-003',
      country_code: 'DE',
      country_name: 'Germany',
      city_code: 'FRA',
      city_name: 'Frankfurt',
      active: true,
      owned: true,
      provider: 'Mullvad',
      ipv4_addr_in: '2.3.4.5',
      public_key: 'def456',
      multihop_port: 1234
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServerFetcherService();
  });

  describe('fetchServersFromAPI', () => {
    it('should fetch servers successfully', async () => {
      // Arrange
      (axios.get as jest.Mock).mockResolvedValueOnce({
        status: 200,
        data: mockServers,
      });

      // Act
      const result = await service.fetchServersFromAPI();

      // Assert
      expect(result).toEqual(mockServers);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      // Arrange
      (axios.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          data: mockServers,
        });

      // Act
      const result = await service.fetchServersFromAPI();

      // Assert
      expect(result).toEqual(mockServers);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should fall back to cache on repeated failures', async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.spyOn(service, 'loadServersFromCache').mockResolvedValueOnce(mockServers);

      // Act
      const result = await service.fetchServersFromAPI();

      // Assert
      expect(result).toEqual(mockServers);
      expect(service.loadServersFromCache).toHaveBeenCalledTimes(1);
    });

    it('should return empty array if both API and cache fail', async () => {
      // Arrange
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.spyOn(service, 'loadServersFromCache').mockRejectedValueOnce(new Error('Cache error'));

      // Act
      const result = await service.fetchServersFromAPI();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('filterServers', () => {
    it('should filter servers by country', async () => {
      // Arrange
      jest.spyOn(service as any, 'logger').mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      });

      // Временно меняем конфигурацию для теста
      const originalConfig = require('@/config/config').default;
      jest.mock('@/config/config', () => ({
        ...originalConfig,
        COUNTRY_FILTER: 'SE',
      }));

      // Act
      const result = service.filterServers(mockServers);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].country_code).toBe('SE');
    });
  });

  describe('saveServersToCache', () => {
    it('should save servers to cache', async () => {
      // Arrange
      (fs.mkdir as jest.Mock).mockResolvedValueOnce(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValueOnce(undefined);

      // Act
      await service.saveServersToCache(mockServers);

      // Assert
      expect(fs.mkdir).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadServersFromCache', () => {
    it('should load servers from cache', async () => {
      // Arrange
      (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockServers));

      // Act
      const result = await service.loadServersFromCache();

      // Assert
      expect(result).toEqual(mockServers);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should throw error if cache is not available', async () => {
      // Arrange
      (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));

      // Act & Assert
      await expect(service.loadServersFromCache()).rejects.toThrow('No cached servers available');
    });
  });
}); 