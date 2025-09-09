import { aio } from "btch-downloader";
import axios from "axios";
import type { Request, Response } from "elysia";

export const meta = {
  name: "alldl fast",
  version: "1.0.0",
  description: "Downloads media from various social media URLs",
  author: "Priyanshi Kaur",
  method: "get",
  category: "downloader",
  path: "/alldl?url=",
};

export async function onStart({ req, res }: { req: Request; res: Response }) {
  const url = req.query.url as string | undefined;

  if (!url) {
    return res.status(400).json({
      status: false,
      error: "url query parameter is required",
    });
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return res.status(400).json({
      status: false,
      error: "Invalid URL format. Must start with http:// or https://",
    });
  }

  try {
    const downloadData = await aio(url);

    if (!downloadData || (typeof downloadData === "object" && Object.keys(downloadData).length === 0)) {
      return res.status(404).json({
        status: false,
        error: "Failed to retrieve download info for this URL.",
        source_url: url,
      });
    }

    return res.json({
      status: true,
      result: downloadData,
      source_url: url,
      timestamp: new Date().toISOString(),
      powered_by: "𝙿𝚁𝙸𝚈𝙰𝙽𝚂𝙷𝙸 𝙰𝙿𝙸",
    });
  } catch (error: any) {
    return res.status(500).json({
      status: false,
      error: "Unexpected error while processing the URL.",
      details: error.message || "No additional details",
      source_url: url,
    });
  }
}