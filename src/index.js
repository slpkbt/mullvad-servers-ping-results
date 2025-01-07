const { fetchServers } = require('./serverFetcher');
const { pingAllServers } = require('./pingService');
const { generateConsoleOutput, saveResults } = require('./outputGenerator');

async function main() {
    console.log('Getting server list...');
    const servers = await fetchServers();
    
    if (!servers.length) {
        console.error('Failed to get server list');
        return;
    }

    console.log(`Pinging ${servers.length} servers...`);
    const results = await pingAllServers(servers);
    const sortedResults = results.sort((a, b) => a.ping - b.ping);

    console.log('\nResults:');
    console.log(generateConsoleOutput(sortedResults));

    try {
        await saveResults(sortedResults);
        console.log('\nResults saved to ping_results.json and ping_results.html');
    } catch (error) {
        console.error('\nError saving results:', error.message);
    }
}

main().catch(console.error);
