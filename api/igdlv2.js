const { instagramdl } = require('@bochilteam/scraper-instagram');

const meta = {
  name: "Instagram Downloader V2",
  version: "1.0.0",
  description: "Downloads Instagram media (reels/posts).",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/igdlv2?url="
};

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "The 'url' query parameter is required."
    });
  }

  if (!url.includes("instagram.com")) {
    return res.status(400).json({
      status: false,
      error: "Invalid Instagram URL provided."
    });
  }

  try {
    const data = await instagramdl(url);

    if (!data || !data.data || data.data.length === 0) {
      return res.status(404).json({
        status: false,
        error: "No downloadable media found. The post may be private or unavailable.",
        source_url: url
      });
    }

    return res.json({
      status: true,
      source_url: url,
      result: data.data,
      caption: data.caption || null,
      author: data.author || null,
      powered_by: "Priyanshi's API",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Instagram Downloader V2 Error:", error);
    return res.status(500).json({
      status: false,
      error: error.message,
      source_url: url
    });
  }
}

module.exports = { meta, onStart };