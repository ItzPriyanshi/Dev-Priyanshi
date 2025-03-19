const { google } = require("googleapis");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const stream = require("stream");
const { Buffer } = require('buffer');
const fs = require('fs');

dotenv.config({ override: true });

const meta = {
  name: "gemini",
  version: "1.0.0",
  description: "API endpoint for Google's Gemini 1.5 AI model",
  author: "Priyanshi Kaur",
  method: "get",
  category: "ai",
  path: "/gemini?prompt="
};

const API_KEY = "AIzaSyByR6RPixARKwvjQF8CHXgTy6_4J60oXn4";
const model = "gemini-1.5-flash-latest";
const GENAI_DISCOVERY_URL = `https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta&key=${API_KEY}`;

async function generateContent(prompt, imageUrl = null) {
  try {
    const client = await google.discoverAPI(GENAI_DISCOVERY_URL);
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };
    
    if (imageUrl) {
      const imageData = await fetchImageAsBase64(imageUrl);
      requestBody.contents[0].parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData
        }
      });
    }
    
    const result = await client.models.generateContent({
      model: `models/${model}`,
      key: API_KEY,
      requestBody
    });
    
    return result.data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error("Image fetch error:", error);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
}

async function onStart({ res, req }) {
  const { prompt, image } = req.query;
  
  if (!prompt) {
    return res.status(400).json({
      status: false,
      error: 'Prompt parameter is required'
    });
  }
  
  try {
    console.log("Request Prompt:", prompt);
    console.log("Request Image URL:", image || "None");
    
    const result = await generateContent(prompt, image);
    
    return res.json({
      status: true,
      data: result,
      prompt: prompt,
      model: model,
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