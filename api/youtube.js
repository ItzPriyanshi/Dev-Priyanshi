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

// Important constants
const J2DOWN_SECRET = 'U2FsdGVkX18wVfoTqTpAQwAnu9WB9osIMSnldIhYg6rMvFJkhpT6eUM9YqgpTrk41mk8calhYvKyhGF0n26IDXNmtXqI8MjsXtsq0nnAQLROrsBuLnu4Mzu63mpJsGyw';

const headers = {
  'Content-Type': 'application/json',
  token: 'eyJ0eXAiOiJqd3QiLCJhbGciOiJIUzI1NiJ9.eyJxxx',
};

// Helper functions
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

async function onStart({ res, req }) {
  // Extract the 'url' parameter from the query string
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ 
      status: false, 
      error: 'URL parameter is required' 
    });
  }

  try {
    console.log("Request URL:", url);
    
    // Encrypt the data using the provided encryption function
    const encryptedData = encryptData(JSON.stringify({ url, unlock: true }));
    console.log("Encrypted Data:", encryptedData);
    
    // Make request to external API
    const data = await getAioJ2(encryptedData);
    console.log("API Response:", data);
    
    // Return the response from the external API
    return res.json({
      status: true,
      data: data,
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