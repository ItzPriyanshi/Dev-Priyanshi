const axios = require('axios');

const meta = {
  name: "Loli",
  version: "1.0.0",
  description: "Fetch random loli images with different options",
  author: "Rynn",
  method: "get",
  category: "images",
  path: "/loli"
};

const optionsMap = {
  random: "https://www.loliapi.com/acg/",
  mobile: "https://www.loliapi.com/acg/pe/",
  computer: "https://www.loliapi.com/acg/pc/",
  nonbg: "https://www.loliapi.com/bg/"
};

async function fetchLoliImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    throw error;
  }
}

async function onStart({ req, res }) {
  try {
    const type = req.query.type?.toLowerCase(); // Get ?type=random etc.

    if (!type || !optionsMap[type]) {
      // If no valid type, show available options
      return res.status(200).json({
        status: true,
        message: "Please choose an option by using ?type=",
        available_options: Object.keys(optionsMap)
      });
    }

    const imageBuffer = await fetchLoliImage(optionsMap[type]);
    
    res.writeHead(200, {
      'Content-Type': 'image/jpeg', // most likely JPEG
      'Content-Length': imageBuffer.length,
    });
    res.end(imageBuffer);

  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
}

module.exports = { meta, onStart };