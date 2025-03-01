/**
 * History Analyzer Module
 * Analyzes historical ping data and provides insights on server performance over time
 */

const fs = require('fs').promises;
const path = require('path');
const { SAVE_PATH } = require('./config');

/**
 * Loads the most recent previous results file
 * @returns {Promise<Array|null>} - Previous results or null if not found
 */
async function loadPreviousResults() {
    try {
        const files = await fs.readdir(SAVE_PATH);
        
        // Filter JSON result files and sort by date (newest first)
        const resultFiles = files
            .filter(file => file.startsWith('ping_results_') && file.endsWith('.json') && file !== 'ping_results_latest.json')
            .sort((a, b) => {
                const dateA = a.replace('ping_results_', '').replace('.json', '');
                const dateB = b.replace('ping_results_', '').replace('.json', '');
                return dateB.localeCompare(dateA); // Descending order
            });
        
        // If no previous results, return null
        if (resultFiles.length === 0) {
            return null;
        }
        
        // Load the most recent file
        const data = await fs.readFile(path.join(SAVE_PATH, resultFiles[0]), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading previous results:', error.message);
        return null;
    }
}

/**
 * Compares current results with previous results
 * @param {Array} currentResults - Current ping results
 * @param {Array} previousResults - Previous ping results
 * @returns {Object} - Comparison analysis
 */
function compareWithPrevious(currentResults, previousResults) {
    if (!previousResults || !Array.isArray(previousResults) || previousResults.length === 0) {
        return {
            hasPrevious: false,
            message: 'No previous results available for comparison'
        };
    }
    
    // Create maps for quick lookup
    const currentMap = new Map(currentResults.map(server => [server.hostname, server]));
    const previousMap = new Map(previousResults.map(server => [server.hostname, server]));
    
    // Calculate changes
    const improved = [];
    const degraded = [];
    const unchanged = [];
    const newServers = [];
    const removedServers = [];
    
    // Check current servers against previous
    currentResults.forEach(current => {
        const previous = previousMap.get(current.hostname);
        
        if (!previous) {
            newServers.push(current);
            return;
        }
        
        // Skip unreachable servers in either dataset
        if (current.ping === 9999 || previous.ping === 9999) {
            return;
        }
        
        const pingDiff = current.ping - previous.ping;
        const percentChange = (pingDiff / previous.ping) * 100;
        
        // Add comparison data
        const serverWithComparison = {
            ...current,
            previousPing: previous.ping,
            pingDiff,
            percentChange
        };
        
        // Categorize based on change
        if (Math.abs(pingDiff) < 5) { // Less than 5ms difference is considered unchanged
            unchanged.push(serverWithComparison);
        } else if (pingDiff < 0) {
            improved.push(serverWithComparison);
        } else {
            degraded.push(serverWithComparison);
        }
    });
    
    // Find removed servers
    previousResults.forEach(previous => {
        if (!currentMap.has(previous.hostname)) {
            removedServers.push(previous);
        }
    });
    
    // Sort arrays by ping difference
    improved.sort((a, b) => a.pingDiff - b.pingDiff); // Most improved first
    degraded.sort((a, b) => b.pingDiff - a.pingDiff); // Most degraded first
    
    // Calculate average changes
    const calcAverage = arr => arr.reduce((sum, server) => sum + server.pingDiff, 0) / (arr.length || 1);
    
    const avgImprovement = improved.length ? Math.abs(calcAverage(improved)).toFixed(2) : 0;
    const avgDegradation = degraded.length ? calcAverage(degraded).toFixed(2) : 0;
    
    // Find the most improved and most degraded servers
    const mostImproved = improved.length ? improved[0] : null;
    const mostDegraded = degraded.length ? degraded[0] : null;
    
    return {
        hasPrevious: true,
        timestamp: {
            current: new Date().toISOString(),
            previous: previousResults[0]?.timestamp || 'unknown'
        },
        summary: {
            totalServers: currentResults.length,
            improvedCount: improved.length,
            degradedCount: degraded.length,
            unchangedCount: unchanged.length,
            newCount: newServers.length,
            removedCount: removedServers.length,
            avgImprovement,
            avgDegradation
        },
        highlights: {
            mostImproved: mostImproved ? {
                hostname: mostImproved.hostname,
                country: mostImproved.country,
                city: mostImproved.city,
                currentPing: mostImproved.ping,
                previousPing: mostImproved.previousPing,
                improvement: Math.abs(mostImproved.pingDiff).toFixed(2),
                percentImprovement: Math.abs(mostImproved.percentChange).toFixed(2)
            } : null,
            mostDegraded: mostDegraded ? {
                hostname: mostDegraded.hostname,
                country: mostDegraded.country,
                city: mostDegraded.city,
                currentPing: mostDegraded.ping,
                previousPing: mostDegraded.previousPing,
                degradation: mostDegraded.pingDiff.toFixed(2),
                percentDegradation: mostDegraded.percentChange.toFixed(2)
            } : null
        },
        details: {
            improved: improved.slice(0, 10), // Top 10 most improved
            degraded: degraded.slice(0, 10), // Top 10 most degraded
            new: newServers.slice(0, 10),    // Up to 10 new servers
            removed: removedServers.slice(0, 10) // Up to 10 removed servers
        }
    };
}

/**
 * Analyzes historical trends for a specific server
 * @param {string} hostname - Server hostname to analyze
 * @returns {Promise<Object>} - Historical analysis
 */
async function analyzeServerHistory(hostname) {
    try {
        const files = await fs.readdir(SAVE_PATH);
        
        // Filter and sort result files
        const resultFiles = files
            .filter(file => file.startsWith('ping_results_') && file.endsWith('.json') && file !== 'ping_results_latest.json')
            .sort(); // Chronological order
        
        if (resultFiles.length === 0) {
            return {
                hostname,
                error: 'No historical data available'
            };
        }
        
        // Load all historical data for this server
        const history = [];
        
        for (const file of resultFiles) {
            const data = await fs.readFile(path.join(SAVE_PATH, file), 'utf8');
            const results = JSON.parse(data);
            
            const server = results.find(s => s.hostname === hostname);
            if (server) {
                const timestamp = file.replace('ping_results_', '').replace('.json', '').replace(/-/g, ':');
                history.push({
                    timestamp,
                    date: new Date(timestamp).toLocaleString(),
                    ping: server.ping,
                    packetLoss: server.packetLoss
                });
            }
        }
        
        if (history.length === 0) {
            return {
                hostname,
                error: 'No historical data found for this server'
            };
        }
        
        // Calculate statistics
        const pings = history.map(h => h.ping).filter(p => p < 9999);
        const min = Math.min(...pings);
        const max = Math.max(...pings);
        const avg = pings.reduce((sum, p) => sum + p, 0) / pings.length;
        const stdDev = Math.sqrt(
            pings.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / pings.length
        );
        
        // Calculate stability (lower standard deviation means more stable)
        const stability = 100 - Math.min(100, (stdDev / avg) * 100);
        
        // Calculate reliability (percentage of times the server was reachable)
        const reliability = (pings.length / history.length) * 100;
        
        return {
            hostname,
            dataPoints: history.length,
            history,
            statistics: {
                min: min.toFixed(2),
                max: max.toFixed(2),
                avg: avg.toFixed(2),
                stdDev: stdDev.toFixed(2),
                stability: stability.toFixed(2),
                reliability: reliability.toFixed(2)
            }
        };
    } catch (error) {
        console.error(`Error analyzing server history for ${hostname}:`, error.message);
        return {
            hostname,
            error: error.message
        };
    }
}

module.exports = {
    loadPreviousResults,
    compareWithPrevious,
    analyzeServerHistory
}; 