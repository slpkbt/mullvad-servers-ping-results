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
        <style>
            ${HTML_STYLES}
            th { cursor: pointer; }
            th:hover { background-color: #34495e; }
        </style>
        <script>
            function sortTable(n) {
                var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
                table = document.querySelector("table");
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
                            if (n === 4) {
                                if (Number(x.innerHTML) > Number(y.innerHTML)) {
                                    shouldSwitch = true;
                                    break;
                                }
                            } else if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                                shouldSwitch = true;
                                break;
                            }
                        } else if (dir == "desc") {
                            if (n === 4) {
                                if (Number(x.innerHTML) < Number(y.innerHTML)) {
                                    shouldSwitch = true;
                                    break;
                                }
                            } else if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
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
            }
        </script>
    </head>
    <body>
        <table>
            <tr>
                <th onclick="sortTable(0)">Hostname</th>
                <th onclick="sortTable(1)">Country</th>
                <th onclick="sortTable(2)">City</th>
                <th onclick="sortTable(3)">IP</th>
                <th onclick="sortTable(4)">Ping (ms)</th>
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
