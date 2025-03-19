const axios = require("axios");

const meta = {
    name: "gemini",
    version: "1.5.0",
    description: "Generative AI using Google's Gemini API",
    author: "Priyanshi Kaur",
    method: "post",
    category: "ai",
    path: "/gemini"
};

const API_KEY = "AIzaSyByR6RPixARKwvjQF8CHXgTy6_4J60oXn4";
const model = "gemini-1.5-flash-latest";
const GENAI_DISCOVERY_URL = `https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta&key=${API_KEY}`;

async function fetchGeminiResponse(input) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateText?key=${API_KEY}`;
        const payload = { prompt: { text: input } };
        const headers = { "Content-Type": "application/json" };

        const response = await axios.post(url, payload, { headers });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error?.message || "Gemini API request failed");
    }
}

async function onStart({ res, req }) {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json({
            status: false,
            error: "Text parameter is required"
        });
    }

    try {
        console.log("Processing Text:", text);

        const data = await fetchGeminiResponse(text);
        console.log("API Response:", data);

        return res.json({
            status: true,
            data: data,
            input: text,
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