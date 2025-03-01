/**
 * Mullvad Server Ping Tester
 * Main application entry point
 */

const { fetchServers } = require('./serverFetcher');
const { pingAllServers } = require('./pingService');
const { generateConsoleOutput, saveResults } = require('./outputGenerator');
const { startWebServer } = require('./webServer');
const { loadPreviousResults, compareWithPrevious } = require('./historyAnalyzer');
const { parseCommandLineArgs } = require('./cli');
const chalk = require('chalk');
const { WEB_SERVER } = require('./config');

// Parse command line arguments
parseCommandLineArgs();

/**
 * Main application function
 */
async function main() {
    console.log(chalk.cyan.bold('\n=== Mullvad Server Ping Tester ===\n'));
    
    try {
        // Step 1: Fetch server list
        console.log(chalk.yellow('Step 1/4: Getting server list...'));
        const servers = await fetchServers();
        
        if (!servers.length) {
            console.error(chalk.red('Failed to get server list. Exiting.'));
            return;
        }
        
        console.log(chalk.green(`Successfully fetched ${servers.length} servers\n`));
        
        // Step 2: Ping all servers
        console.log(chalk.yellow(`Step 2/4: Pinging ${servers.length} servers...`));
        const results = await pingAllServers(servers);
        const sortedResults = results.sort((a, b) => a.ping - b.ping);
        
        // Step 3: Compare with previous results if available
        console.log(chalk.yellow('\nStep 3/4: Analyzing results...'));
        const previousResults = await loadPreviousResults();
        const comparison = compareWithPrevious(sortedResults, previousResults);
        
        if (comparison.hasPrevious) {
            console.log(chalk.green('Comparison with previous results:'));
            console.log(`  Total servers: ${comparison.summary.totalServers}`);
            console.log(`  Improved: ${chalk.green(comparison.summary.improvedCount)} servers (avg ${comparison.summary.avgImprovement} ms)`);
            console.log(`  Degraded: ${chalk.red(comparison.summary.degradedCount)} servers (avg ${comparison.summary.avgDegradation} ms)`);
            console.log(`  Unchanged: ${chalk.blue(comparison.summary.unchangedCount)} servers`);
            console.log(`  New: ${chalk.cyan(comparison.summary.newCount)} servers`);
            console.log(`  Removed: ${chalk.yellow(comparison.summary.removedCount)} servers`);
            
            if (comparison.highlights.mostImproved) {
                const improved = comparison.highlights.mostImproved;
                console.log(chalk.green(`\nMost improved server: ${improved.hostname} (${improved.country}, ${improved.city})`));
                console.log(chalk.green(`  Improved by ${improved.improvement} ms (${improved.percentImprovement}%)`));
                console.log(chalk.green(`  Current: ${improved.currentPing} ms, Previous: ${improved.previousPing} ms`));
            }
            
            if (comparison.highlights.mostDegraded) {
                const degraded = comparison.highlights.mostDegraded;
                console.log(chalk.red(`\nMost degraded server: ${degraded.hostname} (${degraded.country}, ${degraded.city})`));
                console.log(chalk.red(`  Degraded by ${degraded.degradation} ms (${degraded.percentDegradation}%)`));
                console.log(chalk.red(`  Current: ${degraded.currentPing} ms, Previous: ${degraded.previousPing} ms`));
            }
        } else {
            console.log(chalk.yellow('No previous results available for comparison.'));
        }
        
        // Step 4: Generate output
        console.log(chalk.yellow('\nStep 4/4: Generating output...'));
        
        // Console output
        console.log(generateConsoleOutput(sortedResults));
        
        // Save results to files
        try {
            await saveResults(sortedResults);
        } catch (error) {
            console.error(chalk.red(`Error saving results: ${error.message}`));
        }
        
        // Start web server if enabled
        if (WEB_SERVER.ENABLED) {
            console.log(chalk.cyan('\nStarting web server...'));
            await startWebServer();
        }
        
        console.log(chalk.green.bold('\nAll done! 🎉'));
        
    } catch (error) {
        console.error(chalk.red(`\nAn error occurred: ${error.message}`));
        console.error(error.stack);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('Unhandled Rejection at:'), promise);
    console.error(chalk.red('Reason:'), reason);
});

// Run the main function
main().catch(error => {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    process.exit(1);
});
