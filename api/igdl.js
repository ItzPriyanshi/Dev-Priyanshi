const { instadl } = require('globalsprak');

const meta = {
  name: "InstagramDL",
  version: "1.0.0",
  description: "Download Instagram post media URLs",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/igdl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "URL parameter is required" });
  }

  try {
    const response = await instadl(url);
    return res.json({
      status: true,
      query: url,
      result: response,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
}

module.exports = { meta, onStart };