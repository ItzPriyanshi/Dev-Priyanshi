const fg = require('api-dylux');

const meta = {
  name: "Sticker",
  version: "1.0.0",
  description: "Search stickers by keyword",
  author: "Priyanshi Kaur",
  method: "get",
  category: "search",
  path: "/stickersearch?query="
};

async function onStart({ res, req }) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ status: false, error: "Query parameter is required" });
  }

  try {
    const data = await fg.StickerSearch(query);

    if (!data || data.length === 0) {
      return res.status(404).json({ status: false, error: "No stickers found" });
    }

    return res.json({
      status: true,
      query,
      results: data,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (err) {
    return res.status(500).json({ status: false, error: err.message });
  }
}

module.exports = { meta, onStart };