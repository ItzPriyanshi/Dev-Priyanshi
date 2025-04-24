const { ytmp3 } = require('@vreden/youtube_scraper');

const meta = {
  name: "ytmp3dl",
  version: "1.0.0",
  description: "Download YouTube audio with selectable quality",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytmp3dl?url=&quality="
};

async function onStart({ req, res }) {
  const { url, quality = "128" } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  try {
    const result = await ytmp3(url, quality);
    if (!result.status) {
      return res.status(500).json({ status: false, error: result.result });
    }

    return res.json({
      status: true,
      url,
      quality,
      metadata: result.metadata,
      download: result.download,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
}

module.exports = { meta, onStart };