/**
 * Интерфейс для серверов Mullvad VPN
 * Описывает структуру данных, получаемых от API Mullvad
 */
export interface IMullvadServer {
  hostname: string;
  country_code: string;
  country_name: string;
  city_code: string;
  city_name: string;
  active: boolean;
  owned: boolean;
  provider: string;
  ipv4_addr_in?: string;
  ipv6_addr_in?: string;
  ipv4_address?: string;
  ipv6_address?: string;
  ip_address?: string;
  ip?: string;
  address?: string;
  public_key: string;
  multihop_port: number;
  socks_name?: string;
  ssh_fingerprint_sha256?: string;
  ssh_fingerprint_md5?: string;
  [key: string]: any; // Для дополнительных полей, которые могут быть в API
}

/**
 * Интерфейс для результатов пинга сервера
 */
export interface IPingResult {
  hostname: string;
  country_code: string;
  country: string;
  city: string;
  ip: string;
  ping: number | null;
  packetLoss: number;
  min: number;
  max: number;
  avg: number;
  stddev: number;
  timestamp: string;
  status: 'good' | 'medium' | 'bad' | 'unreachable';
  server: IMullvadServer;
}

/**
 * Интерфейс для статистики пинга
 */
export interface IPingStatistics {
  totalServers: number;
  reachableServers: number;
  unreachableServers: number;
  averagePing: number;
  goodServers: number;
  mediumServers: number;
  badServers: number;
  bestServer?: IPingResult;
  worstServer?: IPingResult;
  timestamp: string;
  duration: number;
}

/**
 * Интерфейс для исторических данных
 */
export interface IHistoricalData {
  date: string;
  results: IPingResult[];
  statistics: IPingStatistics;
}

/**
 * Интерфейс для опций фильтрации серверов
 */
export interface IFilterOptions {
  countries?: string[];
  cities?: string[];
  onlyActive?: boolean;
  onlyOwned?: boolean;
  providers?: string[];
}

/**
 * Интерфейс для опций пинга
 */
export interface IPingOptions {
  timeout: number;
  retries: number;
  concurrentPings: number;
}

/**
 * Интерфейс для опций вывода
 */
export interface IOutputOptions {
  format: 'json' | 'csv' | 'html' | 'console';
  outputPath?: string;
  topCount?: number;
  verbose?: boolean;
}

/**
 * Интерфейс для статистики пинга
 * Содержит агрегированную информацию о результатах пинга
 */
export interface IPingStats {
  totalServers: number;
  reachableServers: number;
  unreachableServers: number;
  averagePing: number;
  medianPing: number;
  minPing: number;
  maxPing: number;
  goodServers: number;
  mediumServers: number;
  badServers: number;
  timestamp: string;
  countriesStats: Record<string, ICountryStats>;
}

/**
 * Интерфейс для статистики по странам
 * Содержит агрегированную информацию о серверах в конкретной стране
 */
export interface ICountryStats {
  countryCode: string;
  countryName: string;
  totalServers: number;
  reachableServers: number;
  unreachableServers: number;
  averagePing: number;
  medianPing: number;
  minPing: number;
  maxPing: number;
  cities: Record<string, ICityStats>;
}

/**
 * Интерфейс для статистики по городам
 * Содержит агрегированную информацию о серверах в конкретном городе
 */
export interface ICityStats {
  cityName: string;
  totalServers: number;
  reachableServers: number;
  unreachableServers: number;
  averagePing: number;
  medianPing: number;
  minPing: number;
  maxPing: number;
} 