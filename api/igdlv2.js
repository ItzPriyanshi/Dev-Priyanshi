const { igdl } = require('@selxyzz/instagram-dl');

const meta = {
  name: "Instagram Downloader V2",
  version: "1.0.0",
  description: "Downloads media (images/videos) from an Instagram post URL using selxyzz library.",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/igdlv2?url="
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

    // Call the igdl function from @selxyzz/instagram-dl
    const downloadResult = await igdl(url);

    // If no result or invalid response
    if (!downloadResult || !Array.isArray(downloadResult)) {
      console.error("Instagram download library failed:", downloadResult);
      return res.status(404).json({
        status: false,
        error: "Failed to retrieve download links from the provided Instagram URL. It may be private, deleted, or invalid.",
        source_url: url,
      });
    }

    console.log("Instagram download successful.");

    return res.json({
      status: true,
      result: downloadResult, // Array of media items (link, type, thumbnail etc.)
      source_url: url,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });

  } catch (error) {
    console.error("Instagram Downloader V2 Error:", error);

    return res.status(500).json({
      status: false,
      error: "An unexpected error occurred while trying to process the Instagram URL.",
      details: error.message,
      source_url: url,
    });
  }
}

module.exports = { meta, onStart };