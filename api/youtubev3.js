const youtubesearchapi = require("youtube-search-api");
const axios = require("axios");

const meta = {
  name: "YouTubV3",
  version: "2.0.0",
  description: "API endpoint for searching YouTube videos and getting download links",
  author: "Priyansh Rajput",
  method: "get",
  category: "downloader",
  path: "/youtube/search?query="
};

async function onStart({ res, req }) {
  // Extract the 'query' parameter from the query string
  const { query, limit = 3 } = req.query;

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query parameter is required'
    });
  }

  try {
    console.log("Search Query:", query);
    
    // Search YouTube videos using the API
    const searchResults = await youtubesearchapi.GetListByKeyword(query, false, parseInt(limit));

    if (!searchResults.items || searchResults.items.length === 0) {
      return res.status(404).json({
        status: false,
        error: "No results found"
      });
    }

    // Process and enhance the search results with download links
    const results = await Promise.all(searchResults.items.map(async (video) => {
      // Basic video information
      const videoInfo = {
        title: video.title,
        id: video.id,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration: video.length?.simpleText || "N/A",
        views: video.viewCount?.text || "N/A",
        author: video.channelTitle,
        thumbnail: video.thumbnail?.thumbnails?.pop()?.url || null
      };

      // Get download links for both audio and video
      try {
        const audioResponse = await axios.get(
          `https://priyansh-ai.onrender.com/youtube?id=${video.id}&type=audio&apikey=priyansh-here`
        );
        
        const videoResponse = await axios.get(
          `https://priyansh-ai.onrender.com/youtube?id=${video.id}&type=video&apikey=priyansh-here`
        );

        // Add download URLs if available
        if (audioResponse.data && audioResponse.data.status) {
          videoInfo.audioDownload = audioResponse.data.downloadUrl || null;
        }

        if (videoResponse.data && videoResponse.data.status) {
          videoInfo.videoDownload = videoResponse.data.downloadUrl || null;
        }
      } catch (error) {
        console.error(`Error fetching download links for ${video.id}:`, error.message);
        // Continue with the process even if download links fail
        videoInfo.downloadError = "Could not retrieve download links";
      }

      return videoInfo;
    }));

    // Return the processed results
    return res.json({
      status: true,
      query: query,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString(),
      powered_by: "YouTube Search API v2.0.0"
    });

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

// Function to get a single video by ID with download links
async function getVideoById({ res, req }) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      status: false,
      error: 'Video ID is required'
    });
  }
  
  try {
    console.log("Fetching video by ID:", id);
    
    // Get both audio and video download links
    const [audioResponse, videoResponse] = await Promise.all([
      axios.get(`https://priyansh-ai.onrender.com/youtube?id=${id}&type=audio&apikey=priyansh-here`),
      axios.get(`https://priyansh-ai.onrender.com/youtube?id=${id}&type=video&apikey=priyansh-here`)
    ]);
    
    const result = {
      id: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      audioDownload: audioResponse.data.downloadUrl || null,
      videoDownload: videoResponse.data.downloadUrl || null,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    };
    
    return res.json({
      status: true,
      data: result
    });
    
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

// Export multiple functions for different routes
module.exports = { 
  meta, 
  onStart,
  routes: [
    {
      path: "/youtube/video/:id",
      method: "get",
      handler: getVideoById,
      description: "Get download links for a specific YouTube video"
    }
  ]
};