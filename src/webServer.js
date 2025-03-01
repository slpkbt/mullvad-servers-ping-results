/**
 * Web Server Module
 * Provides a web interface for viewing ping results and historical data
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { WEB_SERVER, SAVE_PATH } = require('./config');

/**
 * Starts the web server
 * @returns {Promise<void>}
 */
async function startWebServer() {
    if (!WEB_SERVER.ENABLED) {
        return;
    }

    const app = express();
    const port = WEB_SERVER.PORT;
    const host = WEB_SERVER.HOST;

    // Serve static files
    app.use(express.static(SAVE_PATH));

    // API endpoint to get list of available result files
    app.get('/api/results', async (req, res) => {
        try {
            const files = await fs.readdir(SAVE_PATH);
            const resultFiles = files
                .filter(file => file.startsWith('ping_results_') && file.endsWith('.json'))
                .map(file => {
                    const timestamp = file.replace('ping_results_', '').replace('.json', '');
                    return {
                        filename: file,
                        timestamp,
                        date: new Date(timestamp.replace(/-/g, ':')).toLocaleString()
                    };
                })
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

            res.json(resultFiles);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // API endpoint to get specific result file
    app.get('/api/results/:filename', async (req, res) => {
        try {
            const filePath = path.join(SAVE_PATH, req.params.filename);
            const data = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            res.status(404).json({ error: 'Result file not found' });
        }
    });

    // API endpoint to get comparison between two result files
    app.get('/api/compare', async (req, res) => {
        try {
            const file1 = req.query.file1;
            const file2 = req.query.file2;

            if (!file1 || !file2) {
                return res.status(400).json({ error: 'Two files must be specified for comparison' });
            }

            const [data1, data2] = await Promise.all([
                fs.readFile(path.join(SAVE_PATH, file1), 'utf8').then(JSON.parse),
                fs.readFile(path.join(SAVE_PATH, file2), 'utf8').then(JSON.parse)
            ]);

            // Create a map for quick lookup
            const serverMap = {};
            data1.forEach(server => {
                serverMap[server.hostname] = { old: server };
            });

            data2.forEach(server => {
                if (serverMap[server.hostname]) {
                    serverMap[server.hostname].new = server;
                } else {
                    serverMap[server.hostname] = { new: server };
                }
            });

            // Convert map to array with comparison data
            const comparison = Object.entries(serverMap).map(([hostname, data]) => {
                const oldData = data.old || null;
                const newData = data.new || null;

                if (oldData && newData) {
                    const pingDiff = newData.ping - oldData.ping;
                    return {
                        hostname,
                        country: newData.country,
                        city: newData.city,
                        oldPing: oldData.ping,
                        newPing: newData.ping,
                        pingDiff,
                        percentChange: oldData.ping > 0 ? (pingDiff / oldData.ping * 100).toFixed(2) : 'N/A',
                        status: pingDiff < 0 ? 'improved' : pingDiff > 0 ? 'degraded' : 'unchanged'
                    };
                } else if (newData) {
                    return {
                        hostname,
                        country: newData.country,
                        city: newData.city,
                        oldPing: null,
                        newPing: newData.ping,
                        pingDiff: null,
                        percentChange: null,
                        status: 'new'
                    };
                } else {
                    return {
                        hostname,
                        country: oldData.country,
                        city: oldData.city,
                        oldPing: oldData.ping,
                        newPing: null,
                        pingDiff: null,
                        percentChange: null,
                        status: 'removed'
                    };
                }
            });

            res.json({
                file1: {
                    name: file1,
                    date: new Date(file1.replace('ping_results_', '').replace('.json', '').replace(/-/g, ':')).toLocaleString(),
                    serverCount: data1.length
                },
                file2: {
                    name: file2,
                    date: new Date(file2.replace('ping_results_', '').replace('.json', '').replace(/-/g, ':')).toLocaleString(),
                    serverCount: data2.length
                },
                comparison: comparison.sort((a, b) => {
                    // Sort by status first, then by ping difference
                    if (a.status === 'improved' && b.status !== 'improved') return -1;
                    if (a.status !== 'improved' && b.status === 'improved') return 1;
                    if (a.pingDiff !== null && b.pingDiff !== null) return a.pingDiff - b.pingDiff;
                    return 0;
                })
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Serve index.html for all other routes
    app.get('*', (req, res) => {
        res.sendFile('ping_results_latest.html', { root: SAVE_PATH });
    });

    // Start the server
    app.listen(port, host, () => {
        console.log(`Web server running at http://${host}:${port}/`);
        console.log(`View latest results at http://${host}:${port}/ping_results_latest.html`);
    });
}

module.exports = { startWebServer }; 