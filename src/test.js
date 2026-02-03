/* Test script to call Gemini API locally
*/
import 'dotenv/config';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key not found in .env file");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const payload = {
    "contents": [{
      "parts": [{ "text": prompt }]
    }]
  };

  // Node.js uses fetch, Google Apps Script uses UrlFetchApp
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  
  if (json.candidates && json.candidates[0].content) {
    return json.candidates[0].content.parts[0].text;
  } else {
    console.error("Full Response:", JSON.stringify(json));
    return "Error: No response from AI.";
  }
}

// Example usage:

const scoutingPrompt = `Act as a VC Analyst. Generate a list of 5 top-tier startup accelerators in Europe.
  Return ONLY a JSON array with this exact schema:
  [
    {"name": "Name", "website": "https://url.com", "country": "Country"}
  ]
`;
callGemini(scoutingPrompt).then(result => console.log(result));
