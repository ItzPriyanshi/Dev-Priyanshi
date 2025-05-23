const OpenAI = require("openai");
const axios = require("axios");

const meta = {
  name: "gpt",
  version: "1.0.0",
  description: "API endpoint for OpenAI's GPT Turbo model",
  author: "Priyanshi Kaur",
  method: "get",
  category: "ai",
  path: "/gpt4?prompt="
};

async function getApiKey() {
  try {
    const response = await axios.get("https://pastebin.com/raw/DDbHarpJ");
    return response.data.trim();
  } catch (error) {
    console.error("Error fetching API key:", error);
    throw new Error("Failed to fetch API key");
  }
}

async function createOpenAIClient() {
  const apiKey = await getApiKey();
  return new OpenAI({
    apiKey: apiKey,
  });
}

async function generateGptResponse(prompt) {
  try {
    const openai = await createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    return response;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error(`OpenAI API request failed: ${error.message}`);
  }
}

async function onStart({ res, req }) {
  const { prompt } = req.query;
  if (!prompt) {
    return res.status(400).json({
      status: false,
      error: "Prompt parameter is required",
    });
  }

  try {
    console.log("Processing prompt:", prompt);
    const result = await generateGptResponse(prompt);
    return res.json({
      status: true,
      data: result,
      model: "gpt-3.5-turbo",
      prompt,
      timestamp: new Date().toISOString(),
      powered_by: "Priyanshi's API"
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
}

module.exports = { meta, onStart };