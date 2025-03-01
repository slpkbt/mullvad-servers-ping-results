/**
 * Output Generator Module
 * Responsible for generating various output formats for ping results
 */

const Table = require('cli-table3');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { 
    TABLE_STYLE, 
    HTML_STYLES, 
    SAVE_PATH, 
    SAVE_FORMATS,
    TOP_SERVERS_COUNT,
    PING_THRESHOLDS
} = require('./config');

/**
 * Gets coordinates for a city
 * @param {string} city - City name
 * @param {string} country - Country name
 * @returns {Object} - Coordinates {lat, lng}
 */
function getCoordinatesForCity(city, country) {
    // Map of city coordinates
    const cityCoordinates = {
        // North America
        'New York': { lat: 40.7128, lng: -74.0060 },
        'Los Angeles': { lat: 34.0522, lng: -118.2437 },
        'Chicago': { lat: 41.8781, lng: -87.6298 },
        'Toronto': { lat: 43.6532, lng: -79.3832 },
        'Montreal': { lat: 45.5017, lng: -73.5673 },
        'Vancouver': { lat: 49.2827, lng: -123.1207 },
        'Miami': { lat: 25.7617, lng: -80.1918 },
        'Seattle': { lat: 47.6062, lng: -122.3321 },
        'Dallas': { lat: 32.7767, lng: -96.7970 },
        'Atlanta': { lat: 33.7490, lng: -84.3880 },
        'Denver': { lat: 39.7392, lng: -104.9903 },
        'Phoenix': { lat: 33.4484, lng: -112.0740 },
        
        // Europe
        'London': { lat: 51.5074, lng: -0.1278 },
        'Paris': { lat: 48.8566, lng: 2.3522 },
        'Berlin': { lat: 52.5200, lng: 13.4050 },
        'Madrid': { lat: 40.4168, lng: -3.7038 },
        'Rome': { lat: 41.9028, lng: 12.4964 },
        'Amsterdam': { lat: 52.3676, lng: 4.9041 },
        'Brussels': { lat: 50.8503, lng: 4.3517 },
        'Vienna': { lat: 48.2082, lng: 16.3738 },
        'Stockholm': { lat: 59.3293, lng: 18.0686 },
        'Oslo': { lat: 59.9139, lng: 10.7522 },
        'Copenhagen': { lat: 55.6761, lng: 12.5683 },
        'Helsinki': { lat: 60.1699, lng: 24.9384 },
        'Warsaw': { lat: 52.2297, lng: 21.0122 },
        'Prague': { lat: 50.0755, lng: 14.4378 },
        'Budapest': { lat: 47.4979, lng: 19.0402 },
        'Zurich': { lat: 47.3769, lng: 8.5417 },
        'Geneva': { lat: 46.2044, lng: 6.1432 },
        'Milan': { lat: 45.4642, lng: 9.1900 },
        'Barcelona': { lat: 41.3851, lng: 2.1734 },
        'Dublin': { lat: 53.3498, lng: -6.2603 },
        'Lisbon': { lat: 38.7223, lng: -9.1393 },
        'Athens': { lat: 37.9838, lng: 23.7275 },
        'Frankfurt': { lat: 50.1109, lng: 8.6821 },
        'Munich': { lat: 48.1351, lng: 11.5820 },
        'Hamburg': { lat: 53.5511, lng: 9.9937 },
        'Dusseldorf': { lat: 51.2277, lng: 6.7735 },
        'Tallinn': { lat: 59.4370, lng: 24.7536 },
        'Riga': { lat: 56.9496, lng: 24.1052 },
        'Vilnius': { lat: 54.6872, lng: 25.2797 },
        'Bucharest': { lat: 44.4268, lng: 26.1025 },
        'Sofia': { lat: 42.6977, lng: 23.3219 },
        'Belgrade': { lat: 44.7866, lng: 20.4489 },
        'Zagreb': { lat: 45.8150, lng: 15.9819 },
        'Bratislava': { lat: 48.1486, lng: 17.1077 },
        'Ljubljana': { lat: 46.0569, lng: 14.5058 },
        
        // Asia
        'Tokyo': { lat: 35.6762, lng: 139.6503 },
        'Singapore': { lat: 1.3521, lng: 103.8198 },
        'Hong Kong': { lat: 22.3193, lng: 114.1694 },
        'Seoul': { lat: 37.5665, lng: 126.9780 },
        'Taipei': { lat: 25.0330, lng: 121.5654 },
        'Bangkok': { lat: 13.7563, lng: 100.5018 },
        'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
        'Jakarta': { lat: 6.2088, lng: 106.8456 },
        'Manila': { lat: 14.5995, lng: 120.9842 },
        'Mumbai': { lat: 19.0760, lng: 72.8777 },
        'Delhi': { lat: 28.6139, lng: 77.2090 },
        'Dubai': { lat: 25.2048, lng: 55.2708 },
        
        // Australia & Oceania
        'Sydney': { lat: -33.8688, lng: 151.2093 },
        'Melbourne': { lat: -37.8136, lng: 144.9631 },
        'Brisbane': { lat: -27.4698, lng: 153.0251 },
        'Perth': { lat: -31.9505, lng: 115.8605 },
        'Auckland': { lat: -36.8509, lng: 174.7645 },
        
        // South America
        'Sao Paulo': { lat: -23.5505, lng: -46.6333 },
        'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
        'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
        'Santiago': { lat: -33.4489, lng: -70.6693 },
        'Bogota': { lat: 4.7110, lng: -74.0721 },
        'Lima': { lat: -12.0464, lng: -77.0428 },
        
        // Africa
        'Johannesburg': { lat: -26.2041, lng: 28.0473 },
        'Cape Town': { lat: -33.9249, lng: 18.4241 },
        'Cairo': { lat: 30.0444, lng: 31.2357 },
        'Nairobi': { lat: -1.2921, lng: 36.8219 },
        'Casablanca': { lat: 33.5731, lng: -7.5898 }
    };
    
    // Check if we have coordinates for this city
    if (cityCoordinates[city]) {
        return cityCoordinates[city];
    }
    
    // If city not found, use country coordinates
    const countryCoordinates = {
        'United States': { lat: 37.0902, lng: -95.7129 },
        'Canada': { lat: 56.1304, lng: -106.3468 },
        'United Kingdom': { lat: 55.3781, lng: -3.4360 },
        'Germany': { lat: 51.1657, lng: 10.4515 },
        'France': { lat: 46.2276, lng: 2.2137 },
        'Italy': { lat: 41.8719, lng: 12.5674 },
        'Spain': { lat: 40.4637, lng: -3.7492 },
        'Netherlands': { lat: 52.1326, lng: 5.2913 },
        'Sweden': { lat: 60.1282, lng: 18.6435 },
        'Norway': { lat: 60.4720, lng: 8.4689 },
        'Finland': { lat: 61.9241, lng: 25.7482 },
        'Denmark': { lat: 56.2639, lng: 9.5018 },
        'Poland': { lat: 51.9194, lng: 19.1451 },
        'Switzerland': { lat: 46.8182, lng: 8.2275 },
        'Austria': { lat: 47.5162, lng: 14.5501 },
        'Belgium': { lat: 50.5039, lng: 4.4699 },
        'Ireland': { lat: 53.1424, lng: -7.6921 },
        'Portugal': { lat: 39.3999, lng: -8.2245 },
        'Greece': { lat: 39.0742, lng: 21.8243 },
        'Czech Republic': { lat: 49.8175, lng: 15.4730 },
        'Hungary': { lat: 47.1625, lng: 19.5033 },
        'Romania': { lat: 45.9432, lng: 24.9668 },
        'Bulgaria': { lat: 42.7339, lng: 25.4858 },
        'Serbia': { lat: 44.0165, lng: 21.0059 },
        'Croatia': { lat: 45.1000, lng: 15.2000 },
        'Slovakia': { lat: 48.6690, lng: 19.6990 },
        'Slovenia': { lat: 46.1512, lng: 14.9955 },
        'Estonia': { lat: 58.5953, lng: 25.0136 },
        'Latvia': { lat: 56.8796, lng: 24.6032 },
        'Lithuania': { lat: 55.1694, lng: 23.8813 },
        'Japan': { lat: 36.2048, lng: 138.2529 },
        'Singapore': { lat: 1.3521, lng: 103.8198 },
        'Australia': { lat: -25.2744, lng: 133.7751 },
        'New Zealand': { lat: -40.9006, lng: 174.8860 },
        'Brazil': { lat: -14.2350, lng: -51.9253 },
        'Argentina': { lat: -38.4161, lng: -63.6167 },
        'Chile': { lat: -35.6751, lng: -71.5430 },
        'Colombia': { lat: 4.5709, lng: -74.2973 },
        'Peru': { lat: -9.1900, lng: -75.0152 },
        'South Africa': { lat: -30.5595, lng: 22.9375 },
        'Egypt': { lat: 26.8206, lng: 30.8025 },
        'Kenya': { lat: -0.0236, lng: 37.9062 },
        'Morocco': { lat: 31.7917, lng: -7.0926 }
    };
    
    if (countryCoordinates[country]) {
        // Add a small random offset to avoid all servers in a country being at the exact same spot
        const offset = 0.5; // ~50km offset
        return {
            lat: countryCoordinates[country].lat + (Math.random() * offset * 2 - offset),
            lng: countryCoordinates[country].lng + (Math.random() * offset * 2 - offset)
        };
    }
    
    // Default coordinates (center of the map)
    return { lat: 0, lng: 0 };
}

/**
 * Gets color for ping time based on thresholds
 * @param {number} time - Ping time in ms
 * @returns {string} - Colored string representation of ping time
 */
function getPingColor(time) {
    if (time === 9999) return chalk.red('Unreachable');
    if (time < PING_THRESHOLDS.GOOD) return chalk.green(time.toFixed(2));
    if (time < PING_THRESHOLDS.MEDIUM) return chalk.yellow(time.toFixed(2));
    return chalk.red(time.toFixed(2));
}

/**
 * Generates console output table with top servers
 * @param {Array} results - Array of ping results
 * @returns {string} - Formatted table string
 */
function generateConsoleOutput(results) {
    // Create table with styling
    const table = new Table({
        head: ['Host', 'Country', 'City', 'IP', 'Ping (ms)', 'Loss %'].map(h => chalk.cyan(h)),
        ...TABLE_STYLE
    });

    // Calculate statistics
    const reachable = results.filter(r => r.ping < 9999);
    const avgPing = reachable.length > 0 
        ? (reachable.reduce((sum, r) => sum + r.ping, 0) / reachable.length).toFixed(2) 
        : 'N/A';
    
    // Add top servers to table
    results.slice(0, TOP_SERVERS_COUNT).forEach(result => {
        table.push([
            chalk.white(result.hostname),
            chalk.white(result.country),
            chalk.white(result.city),
            chalk.white(result.ip),
            getPingColor(result.ping),
            result.packetLoss ? chalk.yellow(result.packetLoss + '%') : chalk.green('0%')
        ]);
    });

    // Build output with statistics
    let output = '\n';
    output += chalk.cyan.bold('=== Mullvad Server Ping Results ===\n\n');
    output += chalk.white(`Total Servers: ${chalk.bold(results.length)}\n`);
    output += chalk.white(`Reachable: ${chalk.green.bold(reachable.length)}\n`);
    output += chalk.white(`Unreachable: ${chalk.red.bold(results.length - reachable.length)}\n`);
    output += chalk.white(`Average Ping: ${chalk.bold(avgPing)} ms\n\n`);
    output += chalk.yellow.bold(`Top ${TOP_SERVERS_COUNT} Servers by Ping:\n\n`);
    output += table.toString();
    output += '\n\n';

    return output;
}

/**
 * Generates HTML report with interactive features
 * @param {Array} results - Array of ping results
 * @returns {string} - HTML content
 */
function generateHTML(results) {
    // Calculate statistics for the report
    const timestamp = new Date().toISOString();
    const reachable = results.filter(r => r.ping < 9999);
    const avgPing = reachable.length > 0 
        ? (reachable.reduce((sum, r) => sum + r.ping, 0) / reachable.length).toFixed(2) 
        : 'N/A';
    
    // Count servers by country
    const countryCounts = {};
    results.forEach(r => {
        countryCounts[r.country] = (countryCounts[r.country] || 0) + 1;
    });
    
    // Get top countries
    const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));
    
    // Prepare data for charts
    const countryLabels = JSON.stringify(topCountries.map(c => c.country));
    const countryCounts_data = JSON.stringify(topCountries.map(c => c.count));
    
    // Prepare data for ping distribution chart
    const pingRanges = ['<50ms', '50-100ms', '100-200ms', '>200ms', 'Unreachable'];
    const pingDistribution = [
        results.filter(r => r.ping < 50).length,
        results.filter(r => r.ping >= 50 && r.ping < 100).length,
        results.filter(r => r.ping >= 100 && r.ping < 200).length,
        results.filter(r => r.ping >= 200 && r.ping < 9999).length,
        results.filter(r => r.ping === 9999).length
    ];
    
    // Prepare server coordinates for map
    const mapPoints = results.map(r => {
        // Get real coordinates based on city and country
        const coords = getCoordinatesForCity(r.city, r.country);
        return {
            lat: coords.lat,
            lng: coords.lng,
            hostname: r.hostname,
            country: r.country,
            city: r.city,
            ping: r.ping
        };
    });
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mullvad Server Ping Results</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
              integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
              crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
                integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
                crossorigin=""></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>${HTML_STYLES}</style>
    </head>
    <body>
        <div class="container">
            <h1>Mullvad Server Ping Results</h1>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>Total Servers</h3>
                    <div class="stat-value">${results.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Reachable Servers</h3>
                    <div class="stat-value">${reachable.length}</div>
                </div>
                <div class="stat-card">
                    <h3>Average Ping</h3>
                    <div class="stat-value">${avgPing} ms</div>
                </div>
                <div class="stat-card">
                    <h3>Best Ping</h3>
                    <div class="stat-value">${reachable.length > 0 ? Math.min(...reachable.map(r => r.ping)).toFixed(2) : 'N/A'} ms</div>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="pingDistributionChart"></canvas>
            </div>
            
            <div class="chart-container">
                <canvas id="countryChart"></canvas>
            </div>
            
            <div class="map-container" id="serverMap"></div>
            
            <div class="filters">
                <h3>Filter Results</h3>
                <input type="text" id="searchBox" class="search-box" placeholder="Search by hostname, country, city...">
                
                <div style="margin-top: 10px;">
                    <label>
                        <input type="checkbox" id="showUnreachable" checked> 
                        Show Unreachable Servers
                    </label>
                </div>
            </div>
            
            <table id="resultsTable">
                <thead>
                    <tr>
                        <th onclick="sortTable(0)">Hostname</th>
                        <th onclick="sortTable(1)">Country</th>
                        <th onclick="sortTable(2)">City</th>
                        <th onclick="sortTable(3)">IP</th>
                        <th onclick="sortTable(4)">Ping (ms)</th>
                        <th onclick="sortTable(5)">Packet Loss</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr class="${r.ping === 9999 ? 'unreachable-row' : ''}">
                            <td>${r.hostname}</td>
                            <td>${r.country}</td>
                            <td>${r.city}</td>
                            <td>${r.ip}</td>
                            <td class="${r.ping < PING_THRESHOLDS.GOOD ? 'ping-good' : r.ping < PING_THRESHOLDS.MEDIUM ? 'ping-medium' : 'ping-bad'}">
                                ${r.ping === 9999 ? 'Unreachable' : r.ping.toFixed(2)}
                            </td>
                            <td>${r.packetLoss !== undefined ? r.packetLoss + '%' : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="timestamp">
                Generated on: ${new Date(timestamp).toLocaleString()}
            </div>
        </div>
        
        <script>
            // Table sorting functionality
            function sortTable(n) {
                var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
                table = document.getElementById("resultsTable");
                switching = true;
                dir = "asc";
                
                while (switching) {
                    switching = false;
                    rows = table.rows;
                    
                    for (i = 1; i < (rows.length - 1); i++) {
                        shouldSwitch = false;
                        x = rows[i].getElementsByTagName("TD")[n];
                        y = rows[i + 1].getElementsByTagName("TD")[n];
                        
                        if (dir == "asc") {
                            if (n === 4) { // Ping column
                                const xValue = x.textContent === 'Unreachable' ? 9999 : parseFloat(x.textContent);
                                const yValue = y.textContent === 'Unreachable' ? 9999 : parseFloat(y.textContent);
                                if (xValue > yValue) {
                                    shouldSwitch = true;
                                    break;
                                }
                            } else if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {
                                shouldSwitch = true;
                                break;
                            }
                        } else if (dir == "desc") {
                            if (n === 4) { // Ping column
                                const xValue = x.textContent === 'Unreachable' ? 9999 : parseFloat(x.textContent);
                                const yValue = y.textContent === 'Unreachable' ? 9999 : parseFloat(y.textContent);
                                if (xValue < yValue) {
                                    shouldSwitch = true;
                                    break;
                                }
                            } else if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {
                                shouldSwitch = true;
                                break;
                            }
                        }
                    }
                    
                    if (shouldSwitch) {
                        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                        switching = true;
                        switchcount++;
                    } else {
                        if (switchcount == 0 && dir == "asc") {
                            dir = "desc";
                            switching = true;
                        }
                    }
                }
                
                // Update header indicators
                const headers = table.getElementsByTagName("TH");
                for (i = 0; i < headers.length; i++) {
                    headers[i].classList.remove("asc", "desc");
                }
                headers[n].classList.add(dir);
            }
            
            // Search functionality
            document.getElementById('searchBox').addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = document.querySelectorAll('#resultsTable tbody tr');
                
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            
            // Toggle unreachable servers
            document.getElementById('showUnreachable').addEventListener('change', function() {
                const unreachableRows = document.querySelectorAll('.unreachable-row');
                unreachableRows.forEach(row => {
                    row.style.display = this.checked ? '' : 'none';
                });
            });
            
            // Initialize charts
            document.addEventListener('DOMContentLoaded', function() {
                // Ping distribution chart
                const pingCtx = document.getElementById('pingDistributionChart').getContext('2d');
                new Chart(pingCtx, {
                    type: 'pie',
                    data: {
                        labels: ${JSON.stringify(pingRanges)},
                        datasets: [{
                            data: ${JSON.stringify(pingDistribution)},
                            backgroundColor: [
                                '#27ae60', // Good
                                '#f39c12', // Medium
                                '#e67e22', // High
                                '#c0392b', // Very High
                                '#7f8c8d'  // Unreachable
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'right',
                            },
                            title: {
                                display: true,
                                text: 'Ping Distribution'
                            }
                        }
                    }
                });
                
                // Country distribution chart
                const countryCtx = document.getElementById('countryChart').getContext('2d');
                new Chart(countryCtx, {
                    type: 'bar',
                    data: {
                        labels: ${countryLabels},
                        datasets: [{
                            label: 'Number of Servers',
                            data: ${countryCounts_data},
                            backgroundColor: '#3498db'
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Servers by Country (Top 10)'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Servers'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Country'
                                }
                            }
                        }
                    }
                });
                
                // Initialize map
                const map = L.map('serverMap').setView([20, 0], 2);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                
                // Add server markers to map
                const mapPoints = ${JSON.stringify(mapPoints)};
                mapPoints.forEach(point => {
                    if (point.ping === 9999) return; // Skip unreachable servers
                    
                    // Determine marker color based on ping
                    const color = point.ping < ${PING_THRESHOLDS.GOOD} ? 'green' : 
                                 point.ping < ${PING_THRESHOLDS.MEDIUM} ? 'orange' : 'red';
                    
                    const marker = L.circleMarker([point.lat, point.lng], {
                        radius: 5,
                        fillColor: color,
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map);
                    
                    marker.bindPopup(
                        '<b>' + point.hostname + '</b><br>' +
                        point.city + ', ' + point.country + '<br>' +
                        'Ping: ' + (point.ping === 9999 ? 'Unreachable' : point.ping.toFixed(2) + ' ms')
                    );
                });
                
                // Sort table by ping initially
                sortTable(4);
            });
        </script>
    </body>
    </html>`;
}

/**
 * Generates CSV output
 * @param {Array} results - Array of ping results
 * @returns {string} - CSV content
 */
function generateCSV(results) {
    const headers = ['Hostname', 'Country', 'Country Code', 'City', 'IP', 'Ping (ms)', 'Packet Loss', 'Min', 'Max', 'Avg', 'StdDev', 'Status', 'Timestamp'];
    const rows = results.map(r => [
        r.hostname,
        r.country,
        r.country_code || '',
        r.city,
        r.ip,
        r.ping === 9999 ? 'Unreachable' : r.ping.toFixed(2),
        r.packetLoss !== undefined ? r.packetLoss + '%' : '',
        r.min !== undefined ? r.min.toFixed(2) : '',
        r.max !== undefined ? r.max.toFixed(2) : '',
        r.avg !== undefined ? r.avg.toFixed(2) : '',
        r.stddev !== undefined ? r.stddev.toFixed(2) : '',
        r.status || (r.ping === 9999 ? 'unreachable' : r.ping < PING_THRESHOLDS.GOOD ? 'good' : r.ping < PING_THRESHOLDS.MEDIUM ? 'medium' : 'bad'),
        r.timestamp || new Date().toISOString()
    ]);
    
    return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
}

/**
 * Saves results to files in specified formats
 * @param {Array} results - Array of ping results
 * @returns {Promise<void>}
 */
async function saveResults(results) {
    try {
        // Create output directory if it doesn't exist
        await fs.mkdir(SAVE_PATH, { recursive: true });
        
        // Prepare save operations
        const saveOperations = [];
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        
        // Save in each specified format
        if (SAVE_FORMATS.includes('json')) {
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, `ping_results_${timestamp}.json`), 
                    JSON.stringify(results, null, 2)
                )
            );
            
            // Also save as latest.json for easy access
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, 'ping_results_latest.json'), 
                    JSON.stringify(results, null, 2)
                )
            );
        }
        
        if (SAVE_FORMATS.includes('html')) {
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, `ping_results_${timestamp}.html`), 
                    generateHTML(results)
                )
            );
            
            // Also save as latest.html for easy access
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, 'ping_results_latest.html'), 
                    generateHTML(results)
                )
            );
        }
        
        if (SAVE_FORMATS.includes('csv')) {
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, `ping_results_${timestamp}.csv`), 
                    generateCSV(results)
                )
            );
            
            // Also save as latest.csv for easy access
            saveOperations.push(
                fs.writeFile(
                    path.join(SAVE_PATH, 'ping_results_latest.csv'), 
                    generateCSV(results)
                )
            );
        }
        
        // Execute all save operations
        await Promise.all(saveOperations);
        
        // Log saved files
        console.log('\nResults saved to:');
        if (SAVE_FORMATS.includes('json')) {
            console.log(`- ${path.join(SAVE_PATH, `ping_results_${timestamp}.json`)}`);
            console.log(`- ${path.join(SAVE_PATH, 'ping_results_latest.json')}`);
        }
        if (SAVE_FORMATS.includes('html')) {
            console.log(`- ${path.join(SAVE_PATH, `ping_results_${timestamp}.html`)}`);
            console.log(`- ${path.join(SAVE_PATH, 'ping_results_latest.html')}`);
        }
        if (SAVE_FORMATS.includes('csv')) {
            console.log(`- ${path.join(SAVE_PATH, `ping_results_${timestamp}.csv`)}`);
            console.log(`- ${path.join(SAVE_PATH, 'ping_results_latest.csv')}`);
        }
    } catch (error) {
        console.error('Error saving results:', error.message);
        throw error;
    }
}

module.exports = { 
    generateConsoleOutput, 
    generateHTML, 
    generateCSV, 
    saveResults 
};
