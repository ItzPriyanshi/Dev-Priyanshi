const yts = require('yt-search');

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
      error: 'Query parameter is required'
    });
  }

  try {
    // Perform YouTube search
    const r = await yts(query);
    const videos = r.videos.slice(0, 3);

    if (videos.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'No results found'
      });
    }

    // Format response
    const results = videos.map(v => ({
      title: v.title,
      url: v.url,
      duration: v.timestamp,
      views: v.views,
      author: v.author.name,
      thumbnail: v.thumbnail
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