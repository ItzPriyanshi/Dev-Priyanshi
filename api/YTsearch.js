const youtubesearchapi = require("youtube-search-api");

const meta = {
  name: "YTsearch",
  version: "1.0.0",
  description: "Search YouTube videos and return top 3 results",
  author: "Priyanshi Kaur",
  method: "get",
  category: "social",
  path: "/ytsearch?query="
};

async function onStart({ res, req }) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      status: false,
      error: "Query parameter is required"
    });
  }

  try {
    const searchResults = await youtubesearchapi.GetListByKeyword(query, false, 3);

    if (!searchResults.items || searchResults.items.length === 0) {
      return res.status(404).json({
        status: false,
        error: "No results found"
      });
    }

    const results = searchResults.items.map(video => ({
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      duration: video.length.simpleText || "N/A",
      views: video.viewCount || "N/A",
      author: video.channelTitle,
      thumbnail: video.thumbnail.thumbnails.pop().url
    }));

    return res.json({
      status: true,
      query: query,
      results: results,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (error) {
    console.error("YTsearch API Error:", error.message);
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

module.exports = { meta, onStart };