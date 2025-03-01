# 🚀 Mullvad Server Ping Tester

<div align="center">

![Mullvad VPN](https://mullvad.net/_app/immutable/assets/logo.Ba5MUFAA.svg)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![Dependency Status](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

**Mullvad Server Ping Tester** — высокопроизводительный инструмент для тестирования пинга серверов Mullvad VPN с расширенной аналитикой и визуализацией данных. Помогает найти оптимальные серверы для вашего подключения.

## 📋 Содержание

- [✨ Особенности](#-особенности)
- [🛠️ Технологии](#️-технологии)
- [📦 Установка](#-установка)
- [🚀 Использование](#-использование)
- [📊 Примеры вывода](#-примеры-вывода)
- [🧪 Тестирование](#-тестирование)
- [🔧 Разработка](#-разработка)
- [📁 Структура проекта](#-структура-проекта)
- [🤝 Вклад в проект](#-вклад-в-проект)
- [📝 Лицензия](#-лицензия)

## ✨ Особенности

- **Высокая производительность**: Многопоточное тестирование с оптимизированным использованием ресурсов
- **Расширенная аналитика**: Детальная статистика по странам, городам и отдельным серверам
- **Визуализация данных**: Интерактивные отчеты с графиками и картами
- **Гибкая фильтрация**: Фильтрация серверов по стране, городу и другим параметрам
- **Исторический анализ**: Отслеживание изменений производительности серверов со временем
- **Веб-интерфейс**: Интерактивный веб-интерфейс для удобного просмотра результатов
- **Множество форматов**: Экспорт результатов в JSON, HTML и CSV
- **Современная архитектура**: Использование TypeScript, DI, SOLID и других лучших практик

## 🛠️ Технологии

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)](https://prettier.io/)

</div>

- **TypeScript**: Строгая типизация и современный синтаксис
- **Node.js**: Высокопроизводительная среда выполнения
- **Inversify**: Контейнер внедрения зависимостей
- **Zod**: Валидация конфигурации и данных
- **Commander**: Интерфейс командной строки
- **Express**: Веб-сервер для интерактивного режима
- **Socket.io**: Обновление данных в реальном времени
- **Jest**: Модульное и интеграционное тестирование
- **ESLint & Prettier**: Статический анализ и форматирование кода

## 📦 Установка

### Глобальная установка

```bash
npm install -g mullvad-servers-ping-results
```

### Локальная установка

```bash
# Клонирование репозитория
git clone https://github.com/slpkbt/mullvad-servers-ping-results.git
cd mullvad-servers-ping-results

# Установка зависимостей
npm install

# Сборка проекта
npm run build
```

## 🚀 Использование

### Командная строка

```bash
# Базовое использование
mullvad-ping-tester

# Фильтрация по стране
mullvad-ping-tester --country US,GB,DE

# Фильтрация по городу
mullvad-ping-tester --city "New York,London,Berlin"

# Настройка параметров пинга
mullvad-ping-tester --timeout 2000 --retries 3 --parallel 30

# Выбор форматов вывода
mullvad-ping-tester --format json,html,csv

# Запуск веб-сервера
mullvad-ping-tester --web

# Подробная справка
mullvad-ping-tester --help
```

### Программное использование

```typescript
import { PingTester } from 'mullvad-servers-ping-results';

async function main() {
  const tester = new PingTester({
    countryFilter: 'US,GB',
    cityFilter: 'New York,London',
    pingTimeout: 2000,
    pingRetries: 3,
    concurrentPings: 30,
  });

  const results = await tester.run();
  console.log(`Протестировано ${results.length} серверов`);
}

main().catch(console.error);
```

### Переменные окружения

Вы также можете настроить приложение с помощью переменных окружения. Создайте файл `.env` в корне проекта:

```env
# API Settings
API_URL=https://api.mullvad.net/www/relays/wireguard/

# Ping Settings
PING_TIMEOUT=1500
PING_RETRIES=1

# Performance Settings
CONCURRENT_PINGS=30
MAX_THREADS=0

# Filter Settings
COUNTRY_FILTER=US,GB,DE
CITY_FILTER=

# Web Server Settings
WEB_SERVER_ENABLED=false
WEB_SERVER_PORT=3000
WEB_SERVER_HOST=localhost
```

## 📊 Примеры вывода

### Консольный вывод

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                     Mullvad Server Ping Results                           ║
╟───────────────────────────────────────────────────────────────────────────╢
║ Total Servers: 505 | Reachable: 487 | Unreachable: 18                     ║
║ Average Ping: 78ms | Min: 12ms | Max: 350ms                               ║
╚═══════════════════════════════════════════════════════════════════════════╝

Top 10 Servers by Ping:
╔════════════════╤═══════════╤═══════════╤═══════════╤═══════════╤═══════════╗
║ Hostname       │ Country   │ City      │ IP        │ Ping      │ Status    ║
╟────────────────┼───────────┼───────────┼───────────┼───────────┼───────────╢
║ se-sto-wg-001  │ Sweden    │ Stockholm │ 1.2.3.4   │ 12ms      │ Good      ║
║ de-fra-wg-003  │ Germany   │ Frankfurt │ 2.3.4.5   │ 15ms      │ Good      ║
║ nl-ams-wg-002  │ Netherlands│ Amsterdam│ 3.4.5.6   │ 18ms      │ Good      ║
╚════════════════╧═══════════╧═══════════╧═══════════╧═══════════╧═══════════╝
```

### Веб-интерфейс

<div align="center">
  <img src="https://i.ibb.co/KSqVRhG/3-FB21-C26-CBF0-4-D7-A-B902-3-FB08-D632-AF8.png" alt="Web Interface Example" width="800">
</div>

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# Запуск тестов в режиме наблюдения
npm run test:watch
```

## 🔧 Разработка

```bash
# Запуск в режиме разработки
npm run dev

# Линтинг
npm run lint

# Форматирование
npm run format

# Генерация документации
npm run docs
```

## 📁 Структура проекта

```
mullvad-servers-ping-results/
├── src/
│   ├── config/           # Конфигурация приложения
│   ├── interfaces/       # TypeScript интерфейсы
│   ├── services/         # Сервисы приложения
│   │   ├── __tests__/    # Тесты для сервисов
│   ├── utils/            # Утилиты и вспомогательные функции
│   └── index.ts          # Точка входа приложения
├── tests/                # Тесты
├── .eslintrc.js          # Конфигурация ESLint
├── .prettierrc           # Конфигурация Prettier
├── jest.config.js        # Конфигурация Jest
├── tsconfig.json         # Конфигурация TypeScript
├── package.json          # Зависимости и скрипты
└── README.md             # Документация проекта
```

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Если вы хотите внести свой вклад, пожалуйста, ознакомьтесь с [руководством по внесению вклада](CONTRIBUTING.md).

1. Форкните репозиторий
2. Создайте ветку для вашей функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте ваши изменения (`git commit -m 'feat: add amazing feature'`)
4. Отправьте изменения в ваш форк (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для получения дополнительной информации.

---

<div align="center">

**Сделано с ❤️ для сообщества Mullvad VPN**

[Сообщить о проблеме](https://github.com/slpkbt/mullvad-servers-ping-results/issues) · [Запросить функцию](https://github.com/slpkbt/mullvad-servers-ping-results/issues) · [Документация](https://github.com/slpkbt/mullvad-servers-ping-results/wiki)

</div>
