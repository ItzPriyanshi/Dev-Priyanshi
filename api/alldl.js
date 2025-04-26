const { aio } = require('btch-downloader');
const axios = require('axios');

const meta = {
  name: "alldl",
  version: "1.0.0",
  description: "Downloads media from various social media URLs",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/alldl?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "url query parameter is required",
    });
  }

  // Basic validation: check if it looks like a URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
     return res.status(400).json({
       status: false,
       error: "Invalid URL format provided. Please include http:// or https://",
     });
  }

  try {
    console.log(`Processing URL with AllDL (aio): ${url}`);

    // Call the aio function from the library
    const downloadData = await aio(url);

    // Check if the library returned valid data.
    // Adapt this check based on how 'btch-downloader' signals errors
    // (e.g., null, undefined, object with status:false, or throwing an error handled by catch).
    // Assuming null/undefined or empty object signifies failure if no error is thrown.
    if (!downloadData || (typeof downloadData === 'object' && Object.keys(downloadData).length === 0)) {
      console.error(`AllDL (aio) failed or returned empty data for URL: ${url}`);
      return res.status(404).json({ // Or 500 depending on expected behavior
        status: false,
        error: "Failed to retrieve download information for the provided URL. It might be unsupported, private, or invalid.",
        source_url: url,
      });
    }

    console.log("AllDL (aio) download successful.");

    // The library seems to return the desired JSON structure directly
    return res.json({
      status: true, // Indicate API endpoint success
      result: downloadData, // Embed the library's result directly
      source_url: url,
      timestamp: new Date().toISOString(),
      powered_by: "𝙿𝚁𝙸𝚈𝙰𝙽𝚂𝙷𝙸 𝙰𝙿𝙸"
    });

  } catch (error) {
    console.error("AllDL (aio) Error:", error);

    // Handle errors potentially thrown by the library
    return res.status(500).json({
      status: false,
      error: "An unexpected error occurred while processing the URL with the downloader.",
      // Provide specific error message from the library if helpful and safe
      details: error.message || "No additional details available.",
      source_url: url,
    });
  }
}

module.exports = { meta, onStart };