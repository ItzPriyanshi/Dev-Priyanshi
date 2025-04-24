const fg = require("api-dylux");

const meta = {
  name: "AllDL",
  version: "2.1.0",
  description: "Universal downloader for TikTok, YouTube, Facebook, Twitter, SoundCloud",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/alldl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  const u = url.toLowerCase();
  let result = {};

  try {
    if (u.includes("youtube.com") || u.includes("youtu.be")) {
      const mp4 = await fg.ytmp4(url);
      const mp3 = await fg.ytmp3(url);
      result = { mp4, mp3 };
      console.log("YouTube MP4:", mp4);
      console.log("YouTube MP3:", mp3);
    } else if (u.includes("tiktok.com") || u.includes("vm.tiktok.com")) {
      result = await fg.tiktok(url);
      console.log("TikTok:", result);
    } else if (u.includes("facebook.com") || u.includes("fb.watch")) {
      result = await fg.fbdl(url);
      console.log("Facebook:", result);
    } else if (u.includes("twitter.com") || u.includes("x.com")) {
      result = await fg.twitter(url);
      console.log("Twitter:", result);
    } else if (u.includes("soundcloud.com")) {
      result = await fg.soundcloudDl(url);
      console.log("SoundCloud:", result);
    } else {
      return res.status(400).json({ status: false, error: "URL not supported by alldl" });
    }

    return res.json({
      status: true,
      query: url,
      result,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message || "An error occurred while processing the request"
    });
  }
}

module.exports = { meta, onStart };