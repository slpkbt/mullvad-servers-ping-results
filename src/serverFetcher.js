/**
 * Server Fetcher Module
 * Responsible for fetching server list from Mullvad API and filtering results
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { API_URL, COUNTRY_FILTER, CITY_FILTER, SAVE_PATH } = require('./config');

/**
 * Fetches server list from Mullvad API with retry mechanism
 * @param {number} retries - Number of retries in case of failure
 * @returns {Promise<Array>} - Array of server objects
 */
async function fetchServersFromAPI(retries = 3) {
    try {
        console.log(`Fetching servers from ${API_URL}...`);
        const response = await axios.get(API_URL, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mullvad-Server-Ping-Tester/1.0'
            }
        });
        
        if (response.status !== 200) {
            throw new Error(`API returned status code ${response.status}`);
        }
        
        console.log(`Successfully fetched ${response.data.length} servers`);
        
        return response.data;
    } catch (error) {
        if (retries > 0) {
            console.log(`Error fetching servers: ${error.message}. Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchServersFromAPI(retries - 1);
        }
        
        console.error('Failed to fetch servers after multiple attempts:', error.message);
        
        // Try to load from cache as fallback
        try {
            return await loadServersFromCache();
        } catch (cacheError) {
            console.error('Could not load servers from cache:', cacheError.message);
            return [];
        }
    }
}

/**
 * Saves servers to cache file
 * @param {Array} servers - Array of server objects
 */
async function saveServersToCache(servers) {
    try {
        const cacheDir = path.join(SAVE_PATH, '.cache');
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(
            path.join(cacheDir, 'servers.json'), 
            JSON.stringify(servers, null, 2)
        );
    } catch (error) {
        console.error('Error saving servers to cache:', error.message);
    }
}

/**
 * Loads servers from cache file
 * @returns {Promise<Array>} - Array of server objects
 */
async function loadServersFromCache() {
    try {
        const cacheFile = path.join(SAVE_PATH, '.cache', 'servers.json');
        const data = await fs.readFile(cacheFile, 'utf8');
        const servers = JSON.parse(data);
        console.log(`Loaded ${servers.length} servers from cache`);
        return servers;
    } catch (error) {
        throw new Error(`No cached servers available: ${error.message}`);
    }
}

/**
 * Filters servers based on country and city filters
 * @param {Array} servers - Array of server objects
 * @returns {Array} - Filtered array of server objects
 */
function filterServers(servers) {
    let filteredServers = [...servers];
    
    // Filter by country if specified
    if (COUNTRY_FILTER) {
        const countries = COUNTRY_FILTER.split(',').map(c => c.trim().toUpperCase());
        filteredServers = filteredServers.filter(server => 
            countries.includes(server.country_code.toUpperCase())
        );
        console.log(`Filtered to ${filteredServers.length} servers in countries: ${COUNTRY_FILTER}`);
    }
    
    // Filter by city if specified
    if (CITY_FILTER) {
        const cities = CITY_FILTER.split(',').map(c => c.trim().toLowerCase());
        filteredServers = filteredServers.filter(server => 
            cities.some(city => server.city_name.toLowerCase().includes(city))
        );
        console.log(`Filtered to ${filteredServers.length} servers in cities: ${CITY_FILTER}`);
    }
    
    return filteredServers;
}

/**
 * Main function to fetch and filter servers
 * @returns {Promise<Array>} - Array of filtered server objects
 */
async function fetchServers() {
    try {
        // Fetch servers from API
        const servers = await fetchServersFromAPI();
        
        // Save to cache for future use
        if (servers.length > 0) {
            await saveServersToCache(servers);
        }
        
        // Apply filters
        const filteredServers = filterServers(servers);
        
        if (filteredServers.length === 0) {
            console.warn('No servers match the specified filters!');
        }
        
        return filteredServers;
    } catch (error) {
        console.error('Error in fetchServers:', error.message);
        return [];
    }
}

module.exports = { fetchServers };
