// generate_content.js
// This script is run by GitHub Actions to fetch new AI content and update index.html

const fs = require('fs').promises; // Node.js file system promises API
const path = require('path'); // Node.js path module

async function generateAIContent() {
    // Define the prompt for the AI
    const prompt = "Generate a new, interesting, and concise fact about space, formatted as a single paragraph. Make it engaging and easy to understand.";

    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
        contents: chatHistory,
        // Optional: Add generationConfig for more control over the response
        generationConfig: {
            temperature: 0.7, // Controls randomness. Lower for more deterministic, higher for more creative.
            maxOutputTokens: 200, // Limit the length of the generated fact
        }
    };

    // Replace with your actual API key or ensure it's handled by the environment
    // For GitHub Actions, __app_id and __firebase_config are not directly available for LLM calls.
    // The API key for Gemini API should be set as a GitHub Secret (e.g., GEMINI_API_KEY)
    // and passed as an environment variable to this script.
    const apiKey = process.env.GEMINI_API_KEY || ""; // Placeholder for API key

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    console.log('Fetching new AI content...');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            console.log('AI content generated successfully.');
            return text;
        } else {
            console.error('Unexpected API response structure:', JSON.stringify(result, null, 2));
            return "Failed to generate AI content. Please check the API response structure.";
        }
    } catch (error) {
        console.error('Error generating AI content:', error);
        return `Error: ${error.message}. Could not retrieve new AI content.`;
    }
}

async function updateWebsiteContent() {
    const indexPath = path.join(__dirname, 'index.html');
    let htmlContent;

    try {
        htmlContent = await fs.readFile(indexPath, 'utf8');
        console.log('Read index.html successfully.');
    } catch (error) {
        console.error('Error reading index.html:', error);
        return;
    }

    const newAIContent = await generateAIContent();
    const formattedAIContent = `<p>${newAIContent}</p>`; // Wrap in paragraph tags

    // Find the placeholder and replace its content
    // We'll look for the div with id="content" and replace its inner HTML
    const contentDivRegex = /<div id="content" class="[^"]*">[\s\S]*?<\/div>/;
    const replacement = `<div id="content" class="text-lg text-gray-700 leading-relaxed">\n            ${formattedAIContent}\n        </div>`;

    if (htmlContent.match(contentDivRegex)) {
        htmlContent = htmlContent.replace(contentDivRegex, replacement);
        console.log('Injected new AI content into index.html.');
    } else {
        console.warn('Could not find the content div in index.html. Content not updated.');
        // Fallback if the regex fails, perhaps append to body or log
        htmlContent = htmlContent.replace('</body>', `<div id="content" class="text-lg text-gray-700 leading-relaxed">${formattedAIContent}</div>\n</body>`);
    }

    // Update the "Last updated" timestamp
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timestamp = now.toLocaleDateString(undefined, options);
    const lastUpdatedRegex = /<span id="last-updated">.*?<\/span>/;
    htmlContent = htmlContent.replace(lastUpdatedRegex, `<span id="last-updated">${timestamp}</span>`);
    console.log('Updated timestamp in index.html.');

    try {
        await fs.writeFile(indexPath, htmlContent, 'utf8');
        console.log('index.html updated successfully.');
    } catch (error) {
        console.error('Error writing updated index.html:', error);
    }
}

// Execute the update function
updateWebsiteContent();
