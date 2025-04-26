const { Configuration, OpenAIApi } = require("openai");

const meta = {
  name: "gpt4",
  version: "1.0.0",
  description: "API endpoint for OpenAI's GPT-4 Turbo model (hard-coded API key)",
  author: "Mr Frank",
  method: "get",
  category: "ai",
  path: "/gpt4?prompt="
};

const OPENAI_API_KEY = "sk-YOUR_OPENAI_KEY_HERE";  // ← Hard-code your key here

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateGptResponse(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    return response.data;
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
    console.log("Prompt:", prompt);
    const result = await generateGptResponse(prompt);
    return res.json({
      status: true,
      data: result,
      model: "gpt-4-turbo",
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