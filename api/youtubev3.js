const youtubesearchapi = require("youtube-search-api");
const axios = require("axios");

const meta = {
  name: "YouTubeV3",
  version: "2.0.0",
  description: "API endpoint for searching YouTube videos and getting download links",
  author: "Priyansh Rajput",
  method: "get",
  category: "downloader",
  path: "/youtube/search?query="
};

async function onStart({ res, req }) {
  // Extract the 'query' parameter from the query string
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      status: false,
      error: 'Query parameter is required'
    });
  }

  try {
    console.log("Search Query:", query);
    
    // Search YouTube videos using the API - only get the top result
    const searchResults = await youtubesearchapi.GetListByKeyword(query, false, 1);

    if (!searchResults.items || searchResults.items.length === 0) {
      return res.status(404).json({
        status: false,
        error: "No results found"
      });
    }

    // Get the first result (top match)
    const topVideo = searchResults.items[0];
    const videoId = topVideo.id;
    
    // Get download links for both audio and video
    try {
      const audioResponse = await axios.get(
        `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=audio&apikey=priyansh-here`
      );
      
      const videoResponse = await axios.get(
        `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=video&apikey=priyansh-here`
      );

      // Extract the download URLs
      const audioDownloadUrl = audioResponse.data.downloadUrl || 
                             (audioResponse.data.data && audioResponse.data.data.downloadUrl) || 
                             null;
                             
      const videoDownloadUrl = videoResponse.data.downloadUrl || 
                             (videoResponse.data.data && videoResponse.data.data.downloadUrl) || 
                             null;

      // Return the processed results
      return res.json({
        status: true,
        query: query,
        video: {
          title: topVideo.title,
          id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          duration: topVideo.length?.simpleText || "N/A",
          views: topVideo.viewCount?.text || "N/A",
          author: topVideo.channelTitle,
          thumbnail: topVideo.thumbnail?.thumbnails?.pop()?.url || null
        },
        downloads: {
          audio: audioDownloadUrl,
          video: videoDownloadUrl
        },
        timestamp: new Date().toISOString(),
        powered_by: "YouTube Search API v2.0.0"
      });

    } catch (error) {
      console.error(`Error fetching download links for ${videoId}:`, error.message);
      return res.status(500).json({
        status: false,
        error: "Failed to retrieve download links",
        message: error.message
      });
    }

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

// Function to get download links directly by video ID
async function getVideoById({ res, req }) {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      status: false,
      error: 'Video ID is required'
    });
  }
  
  try {
    console.log("Fetching download links for video ID:", id);
    
    // Get both audio and video download links
    const [audioResponse, videoResponse] = await Promise.all([
      axios.get(`https://priyansh-ai.onrender.com/youtube?id=${id}&type=audio&apikey=priyansh-here`),
      axios.get(`https://priyansh-ai.onrender.com/youtube?id=${id}&type=video&apikey=priyansh-here`)
    ]);
    
    // Extract the download URLs
    const audioDownloadUrl = audioResponse.data.downloadUrl || 
                           (audioResponse.data.data && audioResponse.data.data.downloadUrl) || 
                           null;
                           
    const videoDownloadUrl = videoResponse.data.downloadUrl || 
                           (videoResponse.data.data && videoResponse.data.data.downloadUrl) || 
                           null;
    
    return res.json({
      status: true,
      id: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      downloads: {
        audio: audioDownloadUrl,
        video: videoDownloadUrl
      },
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