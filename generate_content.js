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
```yaml
# .github/workflows/daily_update.yml
# This workflow will run daily to update your website with new AI content.

name: Daily AI Content Update

on:
  schedule:
    # Runs every day at 00:00 UTC (midnight)
    # You can adjust the cron schedule as needed.
    # For example, '0 12 * * *' for noon UTC.
    - cron: '0 0 * * *'
  workflow_dispatch: # Allows manual triggering of the workflow from GitHub UI

jobs:
  update-content:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4 # Action to checkout your repository code

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20' # Use a recent LTS version of Node.js

      - name: Run AI content generation script
        # Install node-fetch if your Node.js version doesn't have global fetch
        # For Node.js 18+, global fetch is available.
        # If using an older Node.js or encountering issues, you might need:
        # run: npm install node-fetch && node generate_content.js
        run: node generate_content.js
        env:
          # IMPORTANT: Store your Gemini API Key as a GitHub Secret named GEMINI_API_KEY
          # Go to your repository Settings -> Secrets and variables -> Actions -> New repository secret
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: Commit and push changes
        run: |
          # Configure git user for the commit
          git config user.name "GitHub Actions Bot"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Check if there are any changes to commit
          git diff --exit-code || (git add index.html && git commit -m "Automated: Update daily AI fact" && git push)
        env:
          # GITHUB_TOKEN is automatically provided by GitHub Actions for authentication
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
