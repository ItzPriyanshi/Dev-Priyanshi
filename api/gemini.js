const axios = require("axios");

const meta = {
    name: "gemini",
    version: "1.5.0",
    description: "Gemini 1.5 flash",
    author: "Priyanshi Kaur",
    method: "post",
    category: "ai",
    path: "/gemini"
};

const API_KEY = "AIzaSyByR6RPixARKwvjQF8CHXgTy6_4J60oXn4";
const model = "gemini-1.5-flash-latest";

async function fetchGeminiResponse(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateText?key=${API_KEY}`;
    const response = await axios.post(url, {
        prompt: { text: prompt }
    });

    return response.data;
}

async function onStart({ res, req }) {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({
            status: false,
            error: "Prompt parameter is required"
        });
    }

    try {
        console.log("Processing Prompt:", prompt);
        
        const data = await fetchGeminiResponse(prompt);
        console.log("API Response:", data);

        return res.json({
            status: true,
            data: data,
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