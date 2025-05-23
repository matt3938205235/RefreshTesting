// server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000; // Use port from environment or default to 3000

// Access your API key as an environment variable
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set in the environment variables.');
    process.exit(1); // Exit the process if the API key is missing
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

// Serve static files (your HTML, CSS, JS)
app.use(express.static('public')); // Assuming your frontend files are in a 'public' directory

// Create an API endpoint to get a random fact
app.get('/api/random-fact', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = 'Generate a short, interesting, and random scientific or historical fact. Keep it concise, ideally under 2 sentences.';

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ fact: text });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate fact' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Open http://localhost:${port} in your browser to see the website.`);
});
