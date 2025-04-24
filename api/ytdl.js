const { ytmp3, ytmp4 } = require('@vreden/youtube_scraper');

const meta = {
  name: "YTDL",
  version: "1.2.0",
  description: "Download best audio (320kbps) and video (1080p)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "Missing 'url' query parameter"
    });
  }

  try {
    // Attempt to fetch best audio and video quality
    const [audioResult, videoResult] = await Promise.all([
      ytmp3(url, 320),
      ytmp4(url, 1080)
    ]);

    // Validate and respond
    if (!audioResult.status && !videoResult.status) {
      return res.status(500).json({
        status: false,
        error: "Failed to fetch both audio and video download links"
      });
    }

    return res.json({
      status: true,
      url,
      audio: audioResult.status ? {
        quality: "320kbps",
        download: audioResult.download,
        metadata: audioResult.metadata
      } : null,
      video: videoResult.status ? {
        quality: "1080p",
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