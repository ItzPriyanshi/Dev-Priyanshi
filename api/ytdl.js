const { ytdlv2 } = require('@vreden/youtube_scraper');

const meta = {
  name: "ytdl",
  version: "1.1.0",
  description: "Download YouTube audio and video in best quality (audio 320kbps, video 1080p)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  try {
    // Request best audio and video separately
    const audioResult = await ytdlv2(url, 320);
    const videoResult = await ytdlv2(url, 1080);

    // Fallback logic if specific quality isn't available
    if (!audioResult.status && !videoResult.status) {
      return res.status(500).json({
        status: false,
        error: "Failed to fetch audio and video download links"
      });
    }

    return res.json({
      status: true,
      url,
      audio: audioResult.status ? {
        download: audioResult.download,
        metadata: audioResult.metadata
      } : null,
      video: videoResult.status ? {
        download: videoResult.download,
        metadata: videoResult.metadata
      } : null,
      fallback: {
        audio: !audioResult.status,
        video: !videoResult.status
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message
    });
  }
}

module.exports = { meta, onStart };