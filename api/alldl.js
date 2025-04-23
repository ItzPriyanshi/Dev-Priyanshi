const axios = require("axios");

const meta = {
  name: "AllDL",
  version: "2.0.0",
  description: "Universal downloader for TikTok, Instagram, YouTube, Facebook, Twitter, and more",
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

  // Check if URL is supported
  const supported = [
    "https://vt.tiktok.com",
    "https://www.tiktok.com/",
    "https://www.instagram.com/",
    "https://youtube.com/",
    "https://youtu.be/",
    "https://www.facebook.com",
    "https://fb.watch",
    "https://x.com/",
    "https://twitter.com/",
    "https://vm.tiktok.com"
  ];

  const isSupported = supported.some(domain => url.startsWith(domain));

  if (!isSupported) {
    return res.status(400).json({ status: false, error: "URL not supported by alldl" });
  }

  try {
    const { data } = await axios.get(
      `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
    );

    if (!data?.api) {
      return res.status(500).json({ status: false, error: "Failed to retrieve base API URL" });
    }

    const targetUrl = `${data.api}?url=${encodeURIComponent(url)}`;
    const result = await axios.get(targetUrl);

    return res.json({
      status: true,
      query: url,
      result: result.data,
      fetched_from: targetUrl,
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