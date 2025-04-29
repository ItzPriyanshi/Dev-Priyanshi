const replicate = require("node-replicate");

const meta = {
  name: "SDXL",
  version: "1.0.0",
  description: "Generate images using the stability-ai/sdxl model.",
  author: "Priyanshi Kaur",
  method: "get",
  category: "ai",
  path: "/stablediffusion-sdxl?prompt="
};

async function onStart({ req, res }) {
  const { prompt, ...options } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "'prompt' query parameter is required." });
  try {
    const result = await replicate.run("stability-ai/sdxl", { prompt, ...options });
    return res.json({ status: true, model: "stability-ai/sdxl", result, powered_by: "Priyanshi's API", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message });
  }
}

module.exports = { meta, onStart };