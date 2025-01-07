const axios = require('axios');

async function fetchServers() {
    try {
        const response = await axios.get('https://api.mullvad.net/www/relays/wireguard/');
        return response.data;
    } catch (error) {
        console.error('Cannot get server list:', error.message);
        return [];
    }
}

module.exports = { fetchServers };
