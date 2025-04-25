const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');

const meta = {
  name: "FileUpload",
  version: "1.0.0",
  description: "Upload files to the server from form or external URL",
  author: "Priyanshi Kaur",
  method: "post",
  category: "file",
  path: "/file/upload&url="
};

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
fs.ensureDirSync(uploadDir);

// Multer storage config for direct file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage }).single("file");

// Function to get filename from URL
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = pathname.split('/').pop();
    
    // If filename is empty or doesn't have an extension, use a default name
    if (!filename || !path.extname(filename)) {
      filename = 'downloaded-file';
    }
    
    return filename;
  } catch (error) {
    return 'downloaded-file';
  }
}

// Function to download file from URL
async function downloadFromUrl(url, destPath) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  });
  
  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function onStart({ req, res }) {
  // Check if request contains a URL parameter
  const fileUrl = req.body.url;
  
  if (fileUrl) {
    // Handle URL-based upload
    try {
      // Extract filename from URL
      const originalFilename = getFilenameFromUrl(fileUrl);
      const uniqueFilename = `${Date.now()}-${originalFilename}`;
      const filePath = path.join(uploadDir, uniqueFilename);
      
      // Download the file
      await downloadFromUrl(fileUrl, filePath);
      
      // Get file size
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      return res.json({
        status: true,
        message: "File downloaded and saved successfully",
        fileInfo: {
          originalName: originalFilename,
          storedName: uniqueFilename,
          size: `${(fileSize / 1024).toFixed(2)} KB`,
          path: `/file/download/${uniqueFilename}`
        },
        source: "url",
        sourceUrl: fileUrl,
        timestamp: new Date().toISOString(),
        powered_by: "Priyanshi's API"
      });
    } catch (error) {
      console.error("URL download error:", error.message);
      return res.status(500).json({
        status: false,
        error: `Failed to download file from URL: ${error.message}`
      });
    }
  } else {
    // Handle direct file upload using multer
    upload(req, res, function (err) {
      if (err) {
        return res.status(500).json({
          status: false,
          error: err.message
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          status: false,
          error: "No file uploaded and no URL provided"
        });
      }
      
      res.json({
        status: true,
        message: "File uploaded successfully",
        fileInfo: {
          originalName: req.file.originalname,
          storedName: req.file.filename,
          size: `${(req.file.size / 1024).toFixed(2)} KB`,
          path: `/file/download/${req.file.filename}`
        },
        source: "direct_upload",
        timestamp: new Date().toISOString(),
        powered_by: "Priyanshi's API"
      });
    });
  }
}

module.exports = { meta, onStart };