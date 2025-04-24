const axios = require('axios');

const meta = {
  name: "YTDL",
  version: "1.0.0",
  description: "YouTube downloader from ssyoutube (MP3, MP4, etc.)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

function toFormat(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function time2Number(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number).reverse();
  return parts.reduce((acc, val, idx) => acc + val * Math.pow(60, idx), 0);
}

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  try {
    // First, validate that it's a YouTube URL
    if (!url.match(/youtube\.com|youtu\.be/i)) {
      return res.status(400).json({ status: false, error: "Invalid YouTube URL" });
    }

    const form = {
      url,
      ajax: 1
    };

    // Updated to use more robust error handling and request options
    const response = await got.post('https://api.ssyoutube.com/api/convert', {
      headers: {
        'origin': 'https://ssyoutube.com',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      json: form,
      timeout: 15000, // 15 seconds timeout
      retry: {
        limit: 2
      }
    });

    if (!response.body) {
      throw new Error('Empty response from ssyoutube API');
    }

    let data;
    try {
      // Handle both string and parsed JSON responses
      data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    } catch (parseError) {
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }

    // Check if the API response has the expected structure
    if (!data || !data.url || !Array.isArray(data.url)) {
      return res.status(500).json({
        status: false,
        error: "Invalid API response structure",
        response: data
      });
    }

    const video = {}, audio = {}, other = {};

    for (const item of data.url) {
      // Skip null or invalid items
      if (!item) continue;

      const type = item.ext;
      const quality = item.quality || 'unknown';
      const fileSize = item.filesize || item.contentLength || 0;
      const fileSizeH = toFormat(fileSize);

      // Skip items without a download URL
      if (!item.url) continue;

      const formatObj = {
        quality,
        type,
        fileSize,
        fileSizeH,
        download: item.url
      };

      if (type === 'mp4') {
        video[quality.toLowerCase()] = formatObj;
      } else if (['mp3', 'opus', 'm4a'].includes(type)) {
        audio[quality.toLowerCase()] = formatObj;
      } else if (type) {
        other[quality.toLowerCase()] = formatObj;
      }
    }

    // Handle missing meta information gracefully
    const meta = data.meta || {};
    const duration = time2Number(meta.duration);
    const videoId = data.id || (url.match(/(?:v=|\/)([\w-]+)(?:\?|&|\/|$)/) || [])[1] || '';

    return res.json({
      status: true,
      result: {
        id: videoId,
        title: meta.title || 'Unknown Title',
        thumbnail: videoId ? `https://i.ytimg.com/vi/${videoId}/0.jpg` : null,
        duration,
        video,
        audio,
        other
      },
      query: url,
      powered_by: "ssyoutube",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("ytdl API error:", error);
    
    // Provide more detailed error information
    return res.status(500).json({
      status: false,
      error: error.message || "Unknown error occurred",
      details: error.response ? {
        statusCode: error.response.statusCode,
        body: error.response.body
      } : undefined
    });
  }
}

module.exports = { meta, onStart };