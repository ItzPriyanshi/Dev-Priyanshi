const axios = require('axios');
const CryptoJS = require('crypto-js');

const meta = {
  name: "YouTube",
  version: "1.0.0",
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
    
    if (response && response.data && response.data.mediaUrl) {
      return response.data.mediaUrl;
    }
    throw new Error("Media URL not found in response");
  } catch (error) {
    throw new Error(`Failed to fetch media URL: ${error.message}`);
  }
}

async function fetchFileUrl(mediaUrl, maxRetries = 10) {
  let percent = 0;
  let fileUrl = null;
  let attempt = 0;
  
  while (percent < 100 && attempt < maxRetries) {
    try {
      const encryptedData = encryptData(JSON.stringify({ mediaUrl, unlock: true }));
      const response = await getAioJ2(encryptedData);
      
      if (response && response.data) {
        percent = response.data.percent || 0;
        
        if (response.data.fileUrl) {
          fileUrl = response.data.fileUrl;
          break;
        }
        
        if (percent >= 100) {
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      attempt++;
    } catch (error) {
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return { percent, fileUrl };
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

    const mediaUrl = await fetchMediaUrl(url);
    console.log("Media URL:", mediaUrl);
    
    const { percent, fileUrl } = await fetchFileUrl(mediaUrl);
    console.log("Download Percent:", percent);
    console.log("File URL:", fileUrl);

    const formats = [];
    
    if (fileUrl) {
      formats.push({
        quality: "HD",
        type: "mp4",
        url: fileUrl,
        size: "Unknown"
      });
    }
    
    return res.json({
      status: true,
      data: {
        title: "YouTube Video",
        thumbnail: "",
        duration: "Unknown",
        mediaUrl: mediaUrl,
        percent: percent,
        fileUrl: fileUrl || mediaUrl,
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