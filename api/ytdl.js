const { ytdlv2 } = require('@vreden/youtube_scraper');

const meta = {
  name: "YTDL",
  version: "1.1.0",
  description: "Download YouTube audio and video in best quality (audio 320kbps, video 1080p fallback)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/ytdl?url="
};

async function onStart({ req, res }) {
  const { url } = req.query;
  const audioQuality = req.query.audioQuality || 320; // Default audio quality
  const videoQuality = req.query.videoQuality || 1080; // Default video quality

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  try {
    // Initialize results
    let audioResult = { status: false };
    let videoResult = { status: false };

    try {
      // Request audio
      audioResult = await ytdlv2(url, parseInt(audioQuality));
    } catch (audioErr) {
      console.error("Audio download error:", audioErr.message);
      // Continue execution even if audio fails
    }

    try {
      // Request video
      videoResult = await ytdlv2(url, parseInt(videoQuality));
    } catch (videoErr) {
      console.error("Video download error:", videoErr.message);
      // Continue execution even if video fails
    }

    // Return whatever results we have, even if one failed
    return res.json({
      status: audioResult.status || videoResult.status, // Overall status is true if either audio or video succeeded
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
    console.error("General error:", err);
    return res.status(500).json({
      status: false,
      error: err.message || "Unknown error occurred"
    });
  }
}

module.exports = { meta, onStart };