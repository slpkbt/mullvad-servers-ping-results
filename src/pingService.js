/**
 * Ping Service Module
 * Responsible for pinging servers and collecting performance data
 */

const ping = require('ping');
const os = require('os');
const pLimit = require('p-limit');
const { 
    CONCURRENT_PINGS, 
    MAX_THREADS, 
    PING_TIMEOUT, 
    PING_RETRIES,
    PING_THRESHOLDS 
} = require('./config');

/**
 * Pings a single server with retry mechanism
 * @param {Object} server - Server object with hostname, country, city and IP
 * @param {number} retryCount - Number of retries left
 * @returns {Promise<Object>} - Server object with ping results
 */
async function pingServer(server, retryCount = PING_RETRIES) {
    try {
        // Определяем IP-адрес сервера
        // Проверяем разные возможные поля, так как формат API может меняться
        const serverIP = server.ipv4_addr_in || server.ipv4_address || server.ip_address || server.ip || server.address;
        
        if (!serverIP) {
            console.error(`Не удалось определить IP-адрес для сервера ${server.hostname}`);
            console.log('Доступные поля сервера:', Object.keys(server));
            return createUnreachableResult(server);
        }
        
        // Настраиваем параметры ping в зависимости от ОС
        const isWindows = os.platform() === 'win32';
        const pingOptions = {
            timeout: PING_TIMEOUT / 1000, // Конвертируем мс в секунды
            // Используем разные параметры для Windows и других ОС
            // Уменьшаем количество пакетов с 4 до 2 для ускорения
            extra: isWindows ? ['-n', '2'] : ['-c', '2'],
        };
        
        // Выполняем ping
        const result = await ping.promise.probe(serverIP, pingOptions);
        
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
                status: getPingStatus(pingTime)
            };
        } else if (retryCount > 0) {
            // Повторяем попытку, если сервер недоступен
            return pingServer(server, retryCount - 1);
        } else {
            // Сервер недоступен после всех попыток
            return createUnreachableResult(server);
        }
    } catch (error) {
        if (retryCount > 0) {
            // Повторяем попытку при ошибке
            return pingServer(server, retryCount - 1);
        } else {
            console.error(`Ошибка при пинге ${server.hostname} (${server.ipv4_addr_in || 'неизвестный IP'}):`, error.message);
            return createUnreachableResult(server);
        }
    }
}

/**
 * Creates a result object for unreachable servers
 * @param {Object} server - Server object
 * @returns {Object} - Server object with unreachable status
 */
function createUnreachableResult(server) {
    return {
        hostname: server.hostname,
        country_code: server.country_code,
        country: server.country_name,
        city: server.city_name,
        ip: server.ipv4_addr_in || server.ipv4_address || server.ip_address || server.ip || server.address || 'неизвестный IP',
        ping: 9999,
        packetLoss: 100,
        min: 9999,
        max: 9999,
        avg: 9999,
        stddev: 0,
        timestamp: new Date().toISOString(),
        status: 'unreachable'
    };
}

/**
 * Determines ping status based on thresholds
 * @param {number} pingTime - Ping time in ms
 * @returns {string} - Status: 'good', 'medium', or 'bad'
 */
function getPingStatus(pingTime) {
    if (pingTime < PING_THRESHOLDS.GOOD) return 'good';
    if (pingTime < PING_THRESHOLDS.MEDIUM) return 'medium';
    return 'bad';
}

/**
 * Pings all servers with concurrency control
 * @param {Array} servers - Array of server objects
 * @returns {Promise<Array>} - Array of server objects with ping results
 */
async function pingAllServers(servers) {
    // Determine optimal number of concurrent operations
    const cpuCount = os.cpus().length;
    const maxThreads = MAX_THREADS > 0 ? MAX_THREADS : cpuCount * 2;
    const concurrency = Math.min(CONCURRENT_PINGS, maxThreads);
    
    console.log(`Using ${concurrency} concurrent connections (${cpuCount} CPU cores detected)`);
    
    // Create concurrency limiter
    const limit = pLimit(concurrency);
    
    // Create progress tracking variables
    const total = servers.length;
    let completed = 0;
    let successful = 0;
    let failed = 0;
    
    // Update progress bar function
    const updateProgress = (result) => {
        completed++;
        if (result.ping < 9999) successful++;
        else failed++;
        
        const percent = Math.floor((completed / total) * 100);
        const progressBar = '[' + '='.repeat(Math.floor(percent / 2)) + ' '.repeat(50 - Math.floor(percent / 2)) + ']';
        
        process.stdout.write(`\r${progressBar} ${percent}% | ${completed}/${total} | ✓ ${successful} | ✗ ${failed}`);
        
        return result;
    };
    
    // Create ping tasks with progress tracking
    const tasks = servers.map(server => 
        limit(() => pingServer(server).then(updateProgress))
    );
    
    // Execute all ping tasks
    const results = await Promise.all(tasks);
    
    // Clear progress line and print summary
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(`Completed pinging ${total} servers: ${successful} reachable, ${failed} unreachable`);
    
    return results;
}

module.exports = { pingAllServers, pingServer, getPingStatus };
