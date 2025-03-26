const axios = require('axios');

const meta = {
    name: "spotify",
    version: "1.0.0",
    description: "API endpoint for Spotify track information and processing",
    author: "AJ•KING",
    method: "get",
    category: "downloader",
    path: "/spotify?url="
};

const API_KEYS = ["Gz6mI", "OYYg9T7", "zCk7t"];

async function fetchSpotifyTrack(url, apiKey) {
    try {
        const response = await axios.get('https://api.zm.io.vn/v1/social/autolink', {
            params: {
                url: url,
                apikey: apiKey
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function onStart({ res, req }) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({
            status: false,
            error: 'URL parameter is required'
        });
    }

    for (const apiKey of API_KEYS) {
        try {
            const data = await fetchSpotifyTrack(url, apiKey);
            
            return res.json({
                status: true,
                data: data,
                url: url,
                timestamp: new Date().toISOString(),
                powered_by: "Priyanshi's API"
            });
        } catch (error) {
            console.error(`API Error with key ${apiKey}:`, error.message);
            continue;
        }
    }

    return res.status(500).json({
        status: false,
        error: 'Unable to fetch Spotify track information ! '
    });
}

module.exports = { meta, onStart };