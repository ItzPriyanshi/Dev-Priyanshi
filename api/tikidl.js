const { ttdl } = require('ruhend-scraper');

const meta = {
  name: "TikTok Downloader",
  version: "1.0.0",
  description: "Download TikTok video metadata and links",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/tikidl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, error: 'URL parameter is required' });

  try {
    const data = await ttdl(url);
    return res.json({ status: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}

module.exports = { meta, onStart };