const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const meta = {
  name: "FileUpload",
  version: "1.0.0",
  description: "Upload files to the server",
  author: "Priyanshi Kaur",
  method: "post",
  category: "file",
  path: "/file/upload"
};

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
fs.ensureDirSync(uploadDir);

// Multer storage config
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

async function onStart({ req, res }) {
  upload(req, res, function (err) {
    if (err) {
      return res.status(500).json({ status: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ status: false, error: "No file uploaded" });
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
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  });
}

module.exports = { meta, onStart };