const axios = require('axios');

const meta = {
    name: "spotify-search",
    version: "1.0.0",
    description: "API endpoint for Spotify track search and detailed information",
    author: "Priyanshi Kaur",
    method: "get",
    category: "search",
    path: "/spotify-search?track="
};

const SPOTIFY_CLIENT_ID = "41dd52e608ee4c4ba8b196b943db9f73";
const SPOTIFY_CLIENT_SECRET = "5c7b438712b04d0a9fe2eaae6072fa16";

async function getSpotifyToken() {
    const tokenRes = await axios.post("https://accounts.spotify.com/api/token", new URLSearchParams({
        grant_type: "client_credentials"
    }).toString(), {
        headers: {
            "Authorization": `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    return tokenRes.data.access_token;
}

async function searchSpotifyTrack(trackName, token) {
    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
        headers: {
            "Authorization": `Bearer ${token}`
        },
        params: {
            q: trackName,
            type: "track",
            limit: 5
        }
    });

    return searchRes.data.tracks.items;
}

async function getTrackFeatures(trackId, token) {
    const featuresRes = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    return featuresRes.data;
}

async function getTrackAnalysis(trackId, token) {
    const analysisRes = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    return analysisRes.data;
}

async function onStart({ res, req }) {
    const { track } = req.query;

    if (!track) {
        return res.status(400).json({
            status: false,
            error: 'Track name parameter is required'
        });
    }

    try {
        const token = await getSpotifyToken();
        const tracks = await searchSpotifyTrack(track, token);

        if (tracks.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'No tracks found'
            });
        }

        const processedTracks = await Promise.all(tracks.map(async (trackItem) => {
            let features = null;
            let analysis = null;

            try {
                features = await getTrackFeatures(trackItem.id, token);
                analysis = await getTrackAnalysis(trackItem.id, token);
            } catch (detailError) {
                console.error(`Error fetching track details: ${detailError.message}`);
            }

            return {
                id: trackItem.id,
                name: trackItem.name,
                artists: trackItem.artists.map(artist => ({
                    name: artist.name,
                    id: artist.id
                })),
                album: {
                    name: trackItem.album.name,
                    release_date: trackItem.album.release_date,
                    total_tracks: trackItem.album.total_tracks,
                    images: trackItem.album.images
                },
                popularity: trackItem.popularity,
                preview_url: trackItem.preview_url,
                external_urls: trackItem.external_urls,
                duration_ms: trackItem.duration_ms,
                explicit: trackItem.explicit,
                audio_features: features ? {
                    danceability: features.danceability,
                    energy: features.energy,
                    key: features.key,
                    loudness: features.loudness,
                    mode: features.mode,
                    speechiness: features.speechiness,
                    acousticness: features.acousticness,
                    instrumentalness: features.instrumentalness,
                    liveness: features.liveness,
                    valence: features.valence,
                    tempo: features.tempo,
                    time_signature: features.time_signature
                } : null,
                audio_analysis: analysis ? {
                    tempo: analysis.track.tempo,
                    time_signature: analysis.track.time_signature,
                    key: analysis.track.key,
                    mode: analysis.track.mode,
                    sections_count: analysis.sections.length,
                    segments_count: analysis.segments.length
                } : null
            };
        }));

        return res.json({
            status: true,
            tracks: processedTracks,
            total_tracks: processedTracks.length,
            query: track,
            timestamp: new Date().toISOString(),
            powered_by: "Priyanshi's API"
        });

    } catch (error) {
        console.error("Spotify Search API Error:", error.message);
        return res.status(500).json({
            status: false,
            error: 'Failed to fetch track information',
            details: error.message
        });
    }
}

module.exports = { meta, onStart };