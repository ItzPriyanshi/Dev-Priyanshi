const { downloadVideo } = require('priyansh-all-dl');

const meta = {
  name: "AllDl",
  version: "1.0.0",
  description: "Download videos From Many Social Media Platforms.",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/alldl?url="
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
    // Try audio and video format (if platform supports it)
    const [audioResult, videoResult] = await Promise.allSettled([
      downloadVideo(url, { format: 'audio' }),
      downloadVideo(url)
    ]);

    // Process results
    const audio = audioResult.status === 'fulfilled' ? audioResult.value : null;
    const video = videoResult.status === 'fulfilled' ? videoResult.value : null;

    if (!audio && !video) {
      return res.status(500).json({
        status: false,
        error: "Download failed for both audio and video formats"
      });
    }

    return res.json({
      status: true,
      url,
      platform: (video || audio)?.platform || "unknown",
      title: (video || audio)?.title || "Untitled",
      audio: audio || null,
      video: video || null,
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