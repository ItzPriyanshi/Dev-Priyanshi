const { instagramDownload } = require("@mrnima/instagram-downloader");
const axios = require('axios');

const meta = {
  name: "instagram Downloader V2",
  version: "1.0.0",
  description: "Downloads media (images/videos) from an Instagram post URL.",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/instagram/v2?url="
};

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "url query parameter is required",
    });
  }

  // Basic validation to check if it looks like an Instagram URL
  if (!url.includes("instagram.com")) {
    return res.status(400).json({
      status: false,
      error: "Invalid URL provided. Please provide a valid Instagram post URL.",
    });
  }

  try {
    console.log(`Processing Instagram URL: ${url}`);

    // Call the instagramDownload function from the library
    const downloadResult = await instagramDownload(url);

    // Check the status provided by the library
    if (!downloadResult || !downloadResult.status) {
      console.error("Instagram download library failed:", downloadResult);
      // Determine error message, use library's message if available
      const errorMessage = downloadResult?.message || "Failed to retrieve download links from the provided Instagram URL. The post might be private, deleted, or the URL is incorrect.";
      return res.status(404).json({ // 404 Not Found or 500 Internal Server Error might be appropriate
        status: false,
        error: errorMessage,
        source_url: url,
      });
    }

    console.log("Instagram download successful.");

    // Construct the response, omitting the 'creator' field
    return res.json({
      status: true, // Reflects the library's success status
      result: downloadResult.result, // The array of media links [{ type, link }, ...]
      source_url: url,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API" // Acknowledge the underlying library
    });

  } catch (error) {
    console.error("Instagram Downloader v2 Error:", error);

    // Provide a generic error message for unexpected issues
    // You might want to check error types for more specific responses (e.g., network error vs. library internal error)
    return res.status(500).json({
      status: false,
      error: "An unexpected error occurred while trying to process the Instagram URL.",
      details: error.message, // Include error message for debugging if needed
      source_url: url,
    });
  }
}

module.exports = { meta, onStart };