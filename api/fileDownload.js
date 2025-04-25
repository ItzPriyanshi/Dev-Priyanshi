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
  
  // Validate filename to prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      status: false,
      error: "Invalid filename"
    });
  }
  
  const filePath = path.join(__dirname, "../uploads", filename);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: false,
        error: "File not found"
      });
    }
    
    // Get file stats for content type and size headers
    const stats = await fs.stat(filePath);
    
    // Get file extension to set proper Content-Type
    const ext = path.extname(filename).toLowerCase();
    
    // Basic MIME type mapping
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      // Add more MIME types as needed
    };
    
    // Set Content-Type header if known, otherwise use octet-stream
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Set headers for better download experience
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Handle file stream errors
    fileStream.on('error', (err) => {
      console.error("File stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({
          status: false,
          error: "Failed to stream file"
        });
      }
    });
  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({
      status: false,
      error: "Failed to download file"
    });
  }
}

module.exports = { meta, onStart };