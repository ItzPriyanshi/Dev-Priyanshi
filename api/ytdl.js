const axios = require('axios');
const cheerio = require('cheerio');

const meta = {
  name: "ytdl",
  version: "1.0.0",
  description: "YouTube video downloader API using yt1z.net",
  author: "Aj King",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

async function onStart({ res, req }) {
  // Extract the 'url' parameter from the query string
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'YouTube URL parameter is required'
    });
  }

  // Extract the video ID from the URL
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return res.status(400).json({
      status: false,
      error: 'Invalid YouTube URL'
    });
  }

  try {
    console.log("Processing YouTube URL:", url);
    console.log("Extracted Video ID:", videoId);

    // First request to get the video information
    const response = await axios.post(
      'https://yt1z.net/en/',
      `id=${videoId}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
          'Origin': 'https://yt1z.net',
          'Referer': `https://yt1z.net/en/video/${videoId}`
        }
      }
    );

    // Use cheerio to parse the HTML response
    const $ = cheerio.load(response.data);
    
    // Extract video info
    const title = $('h3.text-xl.font-bold').text().trim();
    const thumbnail = $('img.rounded-lg').attr('src');
    
    // Extract download options
    const downloadOptions = [];
    
    // Extract video formats
    $('.download-item').each((i, el) => {
      const quality = $(el).find('.download-quality').text().trim();
      const format = $(el).find('.download-format').text().trim();
      const size = $(el).find('.download-size').text().trim();
      const downloadUrl = $(el).find('a.download-btn').attr('href');
      
      if (downloadUrl && quality) {
        downloadOptions.push({
          quality,
          format,
          size,
          url: downloadUrl
        });
      }
    });
    
    // Extract audio formats if available
    $('.audio-item').each((i, el) => {
      const quality = $(el).find('.audio-quality').text().trim();
      const format = $(el).find('.audio-format').text().trim();
      const size = $(el).find('.audio-size').text().trim();
      const downloadUrl = $(el).find('a.download-btn').attr('href');
      
      if (downloadUrl && format) {
        downloadOptions.push({
          quality,
          format: format || 'mp3',
          size,
          url: downloadUrl,
          type: 'audio'
        });
      }
    });

    // Return formatted response
    return res.json({
      status: true,
      data: {
        id: videoId,
        title,
        thumbnail,
        downloadOptions
      },
      url: url,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message,
      details: "Failed to fetch video information from yt1z.net"
    });
  }
}

module.exports = { meta, onStart };