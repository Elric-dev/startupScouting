// PRODUCTION: Calls Gemini via Google Apps Script's native fetch.
// using Gemini 2.5 Flash Lite model.


function callGemini(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  // 1. MANDATORY THROTTLE: 4.5s delay to stay under 10 RPM
  // This ensures we never hit the 429 error in the first place.
  Utilities.sleep(300); 

  // Updated URL for Gemini 2.5 Flash Lite (cheaper than gemini 3)
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + apiKey;
  
  const payload = {
  "contents": [{ "parts": [{ "text": prompt }] }],
  "generationConfig": {
    "response_mime_type": "application/json",
    "temperature": 0.2 // Lower temperature = more factual, less creative -> fewer hallucinations
  }
};

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true // Allows us to see the error details without crashing
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  // 2. RETRY LOGIC: If we still hit a 429, wait longer and try one more time
  if (code === 429) {
    logToDrive("Rate limit hit (429). Backing off for 15 seconds...", "WARNING");
    Utilities.sleep(15000); 
    return callGemini(prompt); // Recursive retry
  }

  if (code !== 200) {
    throw new Error("Google API Error: " + response.getContentText());
  }

  const json = JSON.parse(response.getContentText());
  return json.candidates[0].content.parts[0].text;
}