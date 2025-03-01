/**
 * Basic tests for Mullvad Server Ping Tester
 */

const { getPingStatus } = require('../src/pingService');
const { generateCSV } = require('../src/outputGenerator');
const { compareWithPrevious } = require('../src/historyAnalyzer');
const config = require('../src/config');

// Mock data for tests
const mockServers = [
    {
        hostname: 'test-server-1',
        country_code: 'US',
        country: 'United States',
        city: 'New York',
        ip: '192.168.1.1',
        ping: 25,
        packetLoss: 0,
        timestamp: '2023-01-01T00:00:00.000Z',
        status: 'good'
    },
    {
        hostname: 'test-server-2',
        country_code: 'GB',
        country: 'United Kingdom',
        city: 'London',
        ip: '192.168.1.2',
        ping: 75,
        packetLoss: 5,
        timestamp: '2023-01-01T00:00:00.000Z',
        status: 'medium'
    },
    {
        hostname: 'test-server-3',
        country_code: 'JP',
        country: 'Japan',
        city: 'Tokyo',
        ip: '192.168.1.3',
        ping: 150,
        packetLoss: 10,
        timestamp: '2023-01-01T00:00:00.000Z',
        status: 'bad'
    },
    {
        hostname: 'test-server-4',
        country_code: 'DE',
        country: 'Germany',
        city: 'Berlin',
        ip: '192.168.1.4',
        ping: 9999,
        packetLoss: 100,
        timestamp: '2023-01-01T00:00:00.000Z',
        status: 'unreachable'
    }
];

// Previous results with some differences
const mockPreviousServers = [
    {
        hostname: 'test-server-1',
        country_code: 'US',
        country: 'United States',
        city: 'New York',
        ip: '192.168.1.1',
        ping: 35, // Improved in current results
        packetLoss: 0,
        timestamp: '2022-12-01T00:00:00.000Z',
        status: 'good'
    },
    {
        hostname: 'test-server-2',
        country_code: 'GB',
        country: 'United Kingdom',
        city: 'London',
        ip: '192.168.1.2',
        ping: 65, // Degraded in current results
        packetLoss: 0,
        timestamp: '2022-12-01T00:00:00.000Z',
        status: 'medium'
    },
    {
        hostname: 'test-server-5', // Removed in current results
        country_code: 'FR',
        country: 'France',
        city: 'Paris',
        ip: '192.168.1.5',
        ping: 45,
        packetLoss: 0,
        timestamp: '2022-12-01T00:00:00.000Z',
        status: 'good'
    }
];

describe('Configuration', () => {
    test('Config should have required properties', () => {
        expect(config).toHaveProperty('CONCURRENT_PINGS');
        expect(config).toHaveProperty('PING_THRESHOLDS');
        expect(config).toHaveProperty('SAVE_FORMATS');
        expect(config).toHaveProperty('HTML_STYLES');
    });
});

describe('Ping Service', () => {
    test('getPingStatus should correctly categorize ping times', () => {
        expect(getPingStatus(25)).toBe('good');
        expect(getPingStatus(75)).toBe('medium');
        expect(getPingStatus(150)).toBe('bad');
    });
});

describe('Output Generator', () => {
    test('generateCSV should create valid CSV data', () => {
        const csv = generateCSV(mockServers);
        
        // Check that CSV contains headers and all servers
        expect(csv).toContain('Hostname,Country,Country Code');
        expect(csv).toContain('test-server-1');
        expect(csv).toContain('test-server-2');
        expect(csv).toContain('test-server-3');
        expect(csv).toContain('test-server-4');
        
        // Check that CSV has correct number of lines (header + 4 servers)
        const lines = csv.split('\n');
        expect(lines.length).toBe(5);
    });
});

describe('History Analyzer', () => {
    test('compareWithPrevious should correctly identify changes', () => {
        const comparison = compareWithPrevious(mockServers, mockPreviousServers);
        
        // Check basic structure
        expect(comparison).toHaveProperty('hasPrevious', true);
        expect(comparison).toHaveProperty('summary');
        expect(comparison).toHaveProperty('highlights');
        expect(comparison).toHaveProperty('details');
        
        // Check summary counts
        expect(comparison.summary.totalServers).toBe(4);
        expect(comparison.summary.improvedCount).toBe(1); // test-server-1 improved
        expect(comparison.summary.degradedCount).toBe(1); // test-server-2 degraded
        expect(comparison.summary.newCount).toBe(2); // test-server-3 and test-server-4 are new
        expect(comparison.summary.removedCount).toBe(1); // test-server-5 was removed
        
        // Check highlights
        expect(comparison.highlights.mostImproved.hostname).toBe('test-server-1');
        expect(comparison.highlights.mostDegraded.hostname).toBe('test-server-2');
        
        // Check details
        expect(comparison.details.improved[0].hostname).toBe('test-server-1');
        expect(comparison.details.degraded[0].hostname).toBe('test-server-2');
        expect(comparison.details.new).toHaveLength(2);
        expect(comparison.details.removed).toHaveLength(1);
        expect(comparison.details.removed[0].hostname).toBe('test-server-5');
    });
    
    test('compareWithPrevious should handle missing previous results', () => {
        const comparison = compareWithPrevious(mockServers, null);
        
        expect(comparison).toHaveProperty('hasPrevious', false);
        expect(comparison).toHaveProperty('message');
    });
}); 