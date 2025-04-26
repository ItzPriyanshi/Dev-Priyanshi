const axios = require('axios');

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const meta = {
  name: "llama",
  version: "1.1.0", // Incremented version for uid requirement
  description: "API endpoint for LLaMA models llama3-8b-8192",
  author: "AI Assistant",
  method: "get",
  category: "ai",
  path: "/llama?uid=<user_id>&prompt=<your_prompt>" // Updated path description
};

async function onStart({ res, req }) {
  const { prompt, uid } = req.query; // Extract both prompt and uid
  const model = req.query.model || "llama3-8b-8192";

  // Validate both prompt and uid
  if (!prompt) {
    return res.status(400).json({
      status: false,
      error: "prompt query parameter is required",
    });
  }
  if (!uid) {
    return res.status(400).json({
      status: false,
      error: "uid query parameter is required",
    });
  }

  if (!GROQ_API_KEY) {
      return res.status(503).json({
        status: false,
        error: "AI service is not configured correctly (Missing API Key).",
      });
  }

  try {
    console.log(`[UID: ${uid}] Processing prompt with Groq model ${model}: "${prompt}"`);

    const requestData = {
      model: model,
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 1024,
      // Optional: Pass user identifier to Groq if their API supports it
      // user: uid // Check Groq documentation if they support a 'user' field for moderation/tracking
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    };

    const groqResponse = await axios.post(GROQ_API_URL, requestData, { headers });

    console.log(`[UID: ${uid}] Groq API response received.`);

    const responseData = groqResponse.data;
    const responseText = responseData.choices[0]?.message?.content || null;
    const usage = responseData.usage;

    if (!responseText) {
        console.error(`[UID: ${uid}] Groq response missing content:`, responseData);
        return res.status(500).json({
            status: false,
            uid: uid,
            error: "AI model returned an empty response."
        });
    }

    // Include uid in the response
    return res.json({
      status: true,
      uid: uid,
      data: {
          response: responseText,
      },
      usage: usage,
      model: responseData.model,
      prompt: prompt,
      timestamp: new Date().toISOString(),
      powered_by: "Groq API"
    });

  } catch (error) {
    console.error(`[UID: ${uid}] Groq API Error:`, error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error?.message || error.message || "An error occurred while processing the request with Groq.";
    const statusCode = error.response?.status || 500;

    // Include uid in the error response
    return res.status(statusCode).json({
      status: false,
      uid: uid,
      error: errorMessage,
    });
  }
}

module.exports = { meta, onStart };