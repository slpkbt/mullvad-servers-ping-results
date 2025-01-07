# Mullvad Server Ping Tester

A blazing fast multi-threaded tool to test Mullvad VPN servers and find the optimal ones for your connection.

## Description
Repository description: `🚀 Blazingly fast multi-threaded Mullvad VPN server ping tester with beautiful CLI and HTML output`

## Features

- Multi-threaded server pinging for maximum performance
- Beautiful CLI output with colored ping results
- Generates HTML report with sortable tables
- Exports results to JSON for further analysis
- Smart concurrency management to avoid system overload
- Color-coded ping results:
  - Green: < 50ms
  - Yellow: 50-100ms
  - Red: > 100ms or unreachable
- Now supports only wireguard servers cuz idk why somebody would use other protocols

## Installation

```bash
git clone https://github.com/slpkbt/mullvad-ping-tester
cd mullvad-ping-tester
npm install
```

## Usage

```bash
node index.js
```

## Output Examples

The tool generates three types of output:
- CLI table with top 20 fastest servers
- HTML report with all servers
- JSON file with raw data

## Dependencies

- axios: API requests
- ping: ICMP ping functionality
- cli-table3: CLI table formatting
- chalk: Terminal colors
- p-limit: Concurrency control

## Project Structure

```
mullvad-ping-tester/
├── src/
│   ├── config.js
│   ├── serverFetcher.js
│   ├── pingService.js
│   ├── outputGenerator.js
│   └── index.js
├── package.json
└── README.md
```

## License

MIT License - feel free to use and modify as you want!

## Disclaimer

This tool is not affiliated with Mullvad VPN. It's an independent project to help users find the fastest servers for their location.