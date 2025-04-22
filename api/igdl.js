const { igdl } = require('ruhend-scraper');

const meta = {
  name: "Instagram Downloader",
  version: "1.0.0",
  description: "Download Instagram video and image URLs",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/igdl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: false, error: 'URL parameter is required' });

  try {
    const response = await igdl(url);
    const data = response.data;
    return res.json({ status: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}

module.exports = { meta, onStart };