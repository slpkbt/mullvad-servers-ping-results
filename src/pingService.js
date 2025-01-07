const ping = require('ping');
const os = require('os');

async function pingServer(server) {
    try {
        const result = await ping.promise.probe(server.ipv4_addr_in);
        return {
            hostname: server.hostname,
            country: server.country_name,
            city: server.city_name,
            ip: server.ipv4_addr_in,
            ping: result.alive ? parseFloat(result.time) : 9999
        };
    } catch (error) {
        return {
            hostname: server.hostname,
            country: server.country_name,
            city: server.city_name,
            ip: server.ipv4_addr_in,
            ping: 9999
        };
    }
}

async function pingAllServers(servers) {
    const batchSize = os.cpus().length * 2; // Using twice as many threads as CPU cores
    const results = [];
    
    for (let i = 0; i < servers.length; i += batchSize) {
        const batch = servers.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(server => pingServer(server)));
        results.push(...batchResults);
        
        // Show progress
        process.stdout.write(`\rPinged: ${results.length}/${servers.length}`);
    }
    
    console.log('\n');
    return results;
}

module.exports = { pingAllServers };
