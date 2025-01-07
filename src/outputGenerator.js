const Table = require('cli-table3');
const chalk = require('chalk');
const fs = require('fs').promises;
const { TABLE_STYLE, HTML_STYLES } = require('./config');

function getPingColor(time) {
    if (time === 9999) return chalk.red('Unreachable');
    if (time < 50) return chalk.green(time.toFixed(2));
    if (time < 100) return chalk.yellow(time.toFixed(2));
    return chalk.red(time.toFixed(2));
}

function generateConsoleOutput(results) {
    const table = new Table({
        head: ['Host', 'Country', 'City', 'IP', 'Ping (ms)'].map(h => chalk.cyan(h)),
        ...TABLE_STYLE
    });

    results.slice(0, 20).forEach(result => {
        table.push([
            chalk.white(result.hostname),
            chalk.white(result.country),
            chalk.white(result.city),
            chalk.white(result.ip),
            getPingColor(result.ping)
        ]);
    });

    return table.toString();
}

function generateHTML(results) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Ping Results</title>
        <style>${HTML_STYLES}</style>
    </head>
    <body>
        <table>
            <tr>
                <th>Hostname</th>
                <th>Country</th>
                <th>City</th>
                <th>IP</th>
                <th>Ping (ms)</th>
            </tr>
            ${results.map(r => `
                <tr>
                    <td>${r.hostname}</td>
                    <td>${r.country}</td>
                    <td>${r.city}</td>
                    <td>${r.ip}</td>
                    <td class="${r.ping < 50 ? 'ping-good' : r.ping < 100 ? 'ping-medium' : 'ping-bad'}">
                        ${r.ping === 9999 ? 'Unreachable' : r.ping.toFixed(2)}
                    </td>
                </tr>
            `).join('')}
        </table>
    </body>
    </html>`;
}

async function saveResults(results) {
    await Promise.all([
        fs.writeFile('ping_results.json', JSON.stringify(results, null, 2)),
        fs.writeFile('ping_results.html', generateHTML(results))
    ]);
}

module.exports = { generateConsoleOutput, saveResults };
