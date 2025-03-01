import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения из .env файла
dotenv.config();

/**
 * Схема валидации конфигурации с использованием Zod
 * Определяет типы и ограничения для всех параметров конфигурации
 */
const configSchema = z.object({
  // Network settings
  API_URL: z.string().url(),
  PING_TIMEOUT: z.number().int().positive(),
  PING_RETRIES: z.number().int().nonnegative(),

  // Performance settings
  CONCURRENT_PINGS: z.number().int().positive(),
  MAX_THREADS: z.number().int().nonnegative(),

  // Output settings
  TOP_SERVERS_COUNT: z.number().int().positive(),
  SAVE_PATH: z.string(),
  SAVE_FORMATS: z.array(z.enum(['json', 'html', 'csv'])),

  // Filter settings
  COUNTRY_FILTER: z.string(),
  CITY_FILTER: z.string(),

  // UI settings
  TABLE_STYLE: z.object({
    chars: z.record(z.string()),
    style: z.record(z.array(z.string())),
  }),

  // Ping thresholds
  PING_THRESHOLDS: z.object({
    GOOD: z.number().positive(),
    MEDIUM: z.number().positive(),
  }),

  // Web server settings
  WEB_SERVER: z.object({
    ENABLED: z.boolean(),
    PORT: z.number().int().positive(),
    HOST: z.string(),
  }),

  // HTML styles
  HTML_STYLES: z.string(),

  // History settings
  MAX_HISTORY_FILES: z.number().int().positive().optional(),
});

/**
 * Тип конфигурации, выведенный из схемы Zod
 */
export type TConfig = z.infer<typeof configSchema>;

/**
 * Конфигурация приложения
 * Содержит все настройки для работы приложения
 */
const config: TConfig = {
  // Network settings
  API_URL: process.env.API_URL || 'https://api.mullvad.net/www/relays/wireguard/',
  PING_TIMEOUT: parseInt(process.env.PING_TIMEOUT || '1500', 10),
  PING_RETRIES: parseInt(process.env.PING_RETRIES || '1', 10),

  // Performance settings
  CONCURRENT_PINGS: parseInt(process.env.CONCURRENT_PINGS || '30', 10),
  MAX_THREADS: parseInt(process.env.MAX_THREADS || '0', 10),

  // Output settings
  TOP_SERVERS_COUNT: parseInt(process.env.TOP_SERVERS_COUNT || '20', 10),
  SAVE_PATH: process.env.SAVE_PATH || path.resolve(process.cwd()),
  SAVE_FORMATS: (process.env.SAVE_FORMATS?.split(',') as Array<'json' | 'html' | 'csv'>) || [
    'json',
    'html',
  ],

  // Filter settings
  COUNTRY_FILTER: process.env.COUNTRY_FILTER || '',
  CITY_FILTER: process.env.CITY_FILTER || '',

  // UI settings
  TABLE_STYLE: {
    chars: {
      top: '═',
      'top-mid': '╤',
      'top-left': '╔',
      'top-right': '╗',
      bottom: '═',
      'bottom-mid': '╧',
      'bottom-left': '╚',
      'bottom-right': '╝',
      left: '║',
      'left-mid': '╟',
      right: '║',
      'right-mid': '╢',
      mid: '─',
      'mid-mid': '┼',
      middle: '│',
    },
    style: {
      head: ['cyan'],
      border: ['grey'],
    },
  },

  // Ping thresholds for color coding (in ms)
  PING_THRESHOLDS: {
    GOOD: parseInt(process.env.PING_THRESHOLD_GOOD || '50', 10),
    MEDIUM: parseInt(process.env.PING_THRESHOLD_MEDIUM || '100', 10),
  },

  // Web server settings
  WEB_SERVER: {
    ENABLED: process.env.WEB_SERVER_ENABLED === 'true',
    PORT: parseInt(process.env.WEB_SERVER_PORT || '3000', 10),
    HOST: process.env.WEB_SERVER_HOST || 'localhost',
  },

  // History settings
  MAX_HISTORY_FILES: parseInt(process.env.MAX_HISTORY_FILES || '100', 10),

  // HTML report styles
  HTML_STYLES: `
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 20px; 
      background: #f8f9fa; 
      color: #333; 
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      margin-top: 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      flex: 1;
      min-width: 200px;
      margin: 10px;
      text-align: center;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .filters {
      margin-bottom: 20px;
      padding: 15px;
      background: #f1f3f5;
      border-radius: 8px;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      background: white; 
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th { 
      background: #2c3e50; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      position: sticky;
      top: 0;
    }
    td { 
      padding: 12px; 
      border-bottom: 1px solid #eee; 
    }
    tr:hover {
      background: #f5f5f5;
    }
    tr:nth-child(even) { 
      background: #f9f9f9; 
    }
    tr:nth-child(even):hover {
      background: #f5f5f5;
    }
    .ping-good { 
      color: #27ae60; 
      font-weight: bold;
    }
    .ping-medium { 
      color: #f39c12; 
      font-weight: bold;
    }
    .ping-bad { 
      color: #c0392b; 
      font-weight: bold;
    }
    .map-container {
      height: 400px;
      margin: 20px 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .chart-container {
      margin: 20px 0;
      height: 300px;
    }
    th { 
      cursor: pointer; 
    }
    th:hover { 
      background-color: #34495e; 
    }
    .timestamp {
      text-align: right;
      color: #7f8c8d;
      font-size: 14px;
      margin-top: 20px;
    }
    .search-box {
      width: 100%;
      padding: 10px;
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    @media (max-width: 768px) {
      .stat-card {
        min-width: 100%;
        margin: 5px 0;
      }
      table {
        font-size: 14px;
      }
      td, th {
        padding: 8px;
      }
    }
  `,
};

/**
 * Валидируем конфигурацию с помощью Zod
 * Выбрасывает исключение, если конфигурация невалидна
 */
try {
  configSchema.parse(config);
} catch (error) {
  console.error('Invalid configuration:', error);
  process.exit(1);
}

export default config;
export { config }; 