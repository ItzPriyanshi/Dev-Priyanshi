const axios = require("axios");

const meta = {
  name: "Instagram Downloader",
  version: "2.0.0",
  description: "Download Instagram media (Reels, Posts)",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/igdl?url="
};

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "Missing 'url' query parameter" });
  }

  try {
    const api = `https://api.diioffc.web.id/api/download/instagram?url=${encodeURIComponent(url)}`;
    const response = await axios.get(api);

    const data = response.data;

    if (!data.status) {
      return res.status(500).json({ status: false, error: "Failed to fetch Instagram media", raw: data });
    }

    return res.json({
      status: true,
      query: url,
      creator: data.creator,
      result: data.result,
      total: data.result.length,
      fetched_from: api,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      error: err.message || "Internal server error"
    });
  }
}

module.exports = { meta, onStart };