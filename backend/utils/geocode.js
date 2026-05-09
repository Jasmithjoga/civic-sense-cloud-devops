const fetch = require('node-fetch');

/**
 * Reverse geocode coordinates using Nominatim (OpenStreetMap) — FREE, no API key needed
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {Promise<{address: string, area: string, city: string}>}
 */
const reverseGeocode = async (lng, lat) => {
    const defaults = { address: null, area: null, city: 'Mumbai' };

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'CivicSense/1.0 (civic issue reporting platform)',
            },
        });

        if (!res.ok) return defaults;

        const data = await res.json();
        if (!data || data.error) return defaults;

        const addr = data.address || {};

        // Area: neighbourhood > suburb > village > town
        const area =
            addr.neighbourhood ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.county ||
            null;

        // City: city > town > state_district
        const city =
            addr.city ||
            addr.town ||
            addr.state_district ||
            'Mumbai';

        // Full display name (cleaned)
        const address = data.display_name || null;

        return { address, area, city };
    } catch (err) {
        console.error('Nominatim geocode error:', err.message);
        return defaults;
    }
};

module.exports = { reverseGeocode };
