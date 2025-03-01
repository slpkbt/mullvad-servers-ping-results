/**
 * Command Line Interface Module
 * Handles command line arguments and options
 */

const config = require('./config');

/**
 * Parses command line arguments and updates configuration
 */
function parseCommandLineArgs() {
    const args = process.argv.slice(2);
    
    // Check for --web flag
    if (args.includes('--web') || args.includes('-w')) {
        config.WEB_SERVER.ENABLED = true;
    }
    
    // Check for --country flag
    const countryIndex = args.findIndex(arg => arg === '--country' || arg === '-c');
    if (countryIndex !== -1 && args[countryIndex + 1]) {
        config.COUNTRY_FILTER = args[countryIndex + 1];
    }
    
    // Check for --city flag
    const cityIndex = args.findIndex(arg => arg === '--city' || arg === '-C');
    if (cityIndex !== -1 && args[cityIndex + 1]) {
        config.CITY_FILTER = args[cityIndex + 1];
    }
    
    // Check for --timeout flag
    const timeoutIndex = args.findIndex(arg => arg === '--timeout' || arg === '-t');
    if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
        config.PING_TIMEOUT = parseInt(args[timeoutIndex + 1], 10);
    }
    
    // Check for --retries flag
    const retriesIndex = args.findIndex(arg => arg === '--retries' || arg === '-r');
    if (retriesIndex !== -1 && args[retriesIndex + 1]) {
        config.PING_RETRIES = parseInt(args[retriesIndex + 1], 10);
    }
    
    // Check for --parallel flag
    const parallelIndex = args.findIndex(arg => arg === '--parallel' || arg === '-p');
    if (parallelIndex !== -1 && args[parallelIndex + 1]) {
        config.CONCURRENT_PINGS = parseInt(args[parallelIndex + 1], 10);
    }
    
    // Check for --format flag
    const formatIndex = args.findIndex(arg => arg === '--format' || arg === '-f');
    if (formatIndex !== -1 && args[formatIndex + 1]) {
        config.SAVE_FORMATS = args[formatIndex + 1].split(',');
    }
    
    // Check for --output flag
    const outputIndex = args.findIndex(arg => arg === '--output' || arg === '-o');
    if (outputIndex !== -1 && args[outputIndex + 1]) {
        config.SAVE_PATH = args[outputIndex + 1];
    }
    
    // Check for --help flag
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }
}

/**
 * Shows help information
 */
function showHelp() {
    console.log(`
Mullvad Server Ping Tester

Usage: node index.js [options]

Options:
  -c, --country <codes>    Filter servers by country code (comma-separated)
  -C, --city <names>       Filter servers by city name (comma-separated)
  -t, --timeout <ms>       Ping timeout in milliseconds
  -r, --retries <number>   Number of ping retries
  -p, --parallel <number>  Number of parallel pings
  -f, --format <formats>   Output formats (comma-separated: json,html,csv)
  -o, --output <path>      Path to save results
  -w, --web                Start web server for interactive results
  -h, --help               Show this help information
`);
}

module.exports = { parseCommandLineArgs }; 