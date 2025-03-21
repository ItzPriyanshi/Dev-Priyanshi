const axios = require('axios');
const CryptoJS = require('crypto-js');

const meta = {
  name: "YouTube",
  version: "1.5.0",
  description: "API endpoint for YouTube video information and processing",
  author: "Priyanshi Kaur", 
  method: "get",
  category: "downloader",
  path: "/youtube?url="
};

const J2DOWN_SECRET = 'U2FsdGVkX18wVfoTqTpAQwAnu9WB9osIMSnldIhYg6rMvFJkhpT6eUM9YqgpTrk41mk8calhYvKyhGF0n26IDXNmtXqI8MjsXtsq0nnAQLROrsBuLnu4Mzu63mpJsGyw';

const headers = {
  'Content-Type': 'application/json',
  token: 'eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJxxx',
};

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function secretKey() {
  const decrypted = CryptoJS.AES.decrypt(J2DOWN_SECRET, 'manhg-api');
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function encryptData(data) {
  const key = CryptoJS.enc.Hex.parse(secretKey());
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    iv: iv.toString(CryptoJS.enc.Hex),
    k: randomString(11) + '8QXBNv5pHbzFt5QC',
    r: 'BRTsfMmf3CuN',
    encryptedData: encrypted.toString(),
  };
}

async function getAioJ2(data) {
  const response = await axios.post(
    'https://api.zm.io.vn/v1/social/autolink',
    { data },
    { headers }
  );
  return response.data;
}

async function fetchMediaUrl(url) {
  try {
    const encryptedData = encryptData(JSON.stringify({ url, unlock: true }));
    const response = await getAioJ2(encryptedData);
    
    if (response && response.data) {
      const data = response.data;
      
      // Extract media information from response
      const mediaUrl = data.mediaUrl;
      const mediaId = data.mediaId;
      const mediaQuality = data.mediaQuality;
      const mediaDuration = data.mediaDuration;
      const mediaExtension = data.mediaExtension;
      const mediaFileSize = data.mediaFileSize;
      const mediaThumbnail = data.mediaThumbnail;
      
      return {
        mediaUrl,
        mediaId,
        mediaQuality,
        mediaDuration,
        mediaExtension,
        mediaFileSize,
        mediaThumbnail
      };
    }
    throw new Error("Media information not found in response");
  } catch (error) {
    throw new Error(`Failed to fetch media information: ${error.message}`);
  }
}

async function fetchFileUrl(mediaUrl, maxWaitTime = 3000) {
  let fileUrl = null;
  let fileSize = null;
  let fileName = null;
  let percent = 0;
  
  try {
    const encryptedData = encryptData(JSON.stringify({ mediaUrl, unlock: true }));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), maxWaitTime);
    
    try {
      const response = await axios.post(
        'https://api.zm.io.vn/v1/social/autolink',
        { data: encryptedData },
        { 
          headers,
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response && response.data && response.data.data) {
        const data = response.data.data;
        
        if (data.percent === "Completed" && data.fileUrl) {
          fileUrl = data.fileUrl;
          fileSize = data.fileSize || data.estimatedFileSize;
          fileName = data.fileName;
          percent = "Completed";
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.log("Fallback to mediaUrl due to timeout or error");
    }
  } catch (error) {
    console.error("Error in fetchFileUrl:", error.message);
  }
  
  return { 
    percent, 
    fileUrl, 
    fileSize, 
    fileName 
  };
}

async function onStart({ res, req }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ 
      status: false, 
      error: 'URL parameter is required' 
    });
  }

  try {
    console.log("Request URL:", url);

    const mediaInfo = await fetchMediaUrl(url);
    console.log("Media Info:", mediaInfo);
    
    const { percent, fileUrl, fileSize, fileName } = await fetchFileUrl(mediaInfo.mediaUrl);
    console.log("Download Percent:", percent);
    console.log("File URL:", fileUrl || "Using mediaUrl as fallback");

    const formats = [];
    const downloadUrl = fileUrl || mediaInfo.mediaUrl;
    
    if (downloadUrl) {
      formats.push({
        quality: mediaInfo.mediaQuality || "HD",
        type: mediaInfo.mediaExtension || "mp4",
        url: downloadUrl,
        size: fileSize || mediaInfo.mediaFileSize || "Unknown"
      });
    }
    
    return res.json({
      status: true,
      data: {
        title: fileName || "YouTube Video",
        thumbnail: mediaInfo.mediaThumbnail || "",
        duration: mediaInfo.mediaDuration || "Unknown",
        mediaUrl: mediaInfo.mediaUrl,
        percent: percent || 0,
        fileUrl: downloadUrl,
        fileSize: fileSize || mediaInfo.mediaFileSize,
        fileName: fileName,
        formats: formats
      },
      url: url,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({ 
      status: false, 
      error: error.message
    });
  }
}

module.exports = { meta, onStart };