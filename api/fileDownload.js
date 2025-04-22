const path = require('path');
const fs = require('fs-extra');

const meta = {
  name: "FileDownload",
  version: "1.0.0",
  description: "Download files from the server by filename",
  author: "Priyanshi Kaur",
  method: "get",
  category: "file",
  path: "/file/download/:filename"
};

async function onStart({ req, res }) {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ status: false, error: "File not found" });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err.message);
      res.status(500).json({ status: false, error: "Failed to download file" });
    }
  });
}

module.exports = { meta, onStart };