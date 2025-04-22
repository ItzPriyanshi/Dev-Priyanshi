const axios = require('axios');

const meta = {
  name: "AllDL",
  version: "1.0.0",
  description: "Download Facebook reels or videos via RapidAPI service",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/alldl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: false, error: "URL parameter is required" });
  }

  const options = {
    method: 'GET',
    url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
    params: { url },
    headers: {
      'x-rapidapi-key': '9f6f59c4a0mshf76495269afd036p18d05ejsnea07670b73b0',
      'x-rapidapi-host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return res.json({
      status: true,
      query: url,
      result: response.data,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message
    });
  }
}

module.exports = { meta, onStart };