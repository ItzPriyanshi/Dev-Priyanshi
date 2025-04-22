import YTDL from './ytdl/class.js';

const meta = {
  name: "ytdl",
  version: "1.0.0",
  description: "API endpoint for downloading YouTube videos and audio",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

const ytdl = new YTDL();

async function onStart({ res, req }) {
  const { url, type = 'video' } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'URL parameter is required'
    });
  }

  try {
    console.log(`Processing ${type} download for URL:`, url);
    
    let result;
    
    if (type.toLowerCase() === 'audio') {
      result = await ytdl.ytaudio(url);
    } else {
      result = await ytdl.ytvideo(url);
    }

    if (!result) {
      return res.status(404).json({
        status: false,
        error: "Failed to process YouTube URL"
      });
    }

    return res.json({
      status: true,
      type: type.toLowerCase(),
      url: url,
      data: result,
      timestamp: new Date().toISOString(),
      powered_by: "YouTube Downloader API v1.0.0"
    });

  } catch (error) {
    console.error("API Error:", error.message);
    
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

async function getVideo({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'URL parameter is required'
    });
  }

  try {
    console.log("Processing video download for URL:", url);
    
    const result = await ytdl.ytvideo(url);
    
    if (!result) {
      return res.status(404).json({
        status: false,
        error: "Failed to process YouTube video"
      });
    }

    return res.json({
      status: true,
      type: "video",
      url: url,
      data: result,
      timestamp: new Date().toISOString(),
      powered_by: "YouTube Downloader API v1.0.0"
    });
    
  } catch (error) {
    console.error("API Error:", error.message);
    
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

async function getAudio({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: 'URL parameter is required'
    });
  }

  try {
    console.log("Processing audio download for URL:", url);
    
    const result = await ytdl.ytaudio(url);
    
    if (!result) {
      return res.status(404).json({
        status: false,
        error: "Failed to process YouTube audio"
      });
    }

    return res.json({
      status: true,
      type: "audio",
      url: url,
      data: result,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
    
  } catch (error) {
    console.error("API Error:", error.message);
    
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

module.exports = { 
  meta, 
  onStart,
  routes: [
    { 
      path: "/ytdl/video", 
      method: "get", 
      handler: getVideo, 
      description: "Get download link for YouTube video" 
    },
    { 
      path: "/ytdl/audio", 
      method: "get", 
      handler: getAudio, 
      description: "Get download link for YouTube audio" 
    }
  ]
};