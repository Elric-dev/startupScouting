// Helper to manage sheet creation and headers
function getOrCreateSheet(name) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name);
    if (name === 'accelerators') sheet.appendRow(['Website', 'Name', 'Country']);
    if (name === 'startups') sheet.appendRow(['Website', 'Name', 'Country', 'Source', 'Value Proposition']);
  }
  return sheet;
}

// Helper for idempotency (prevents duplicates)
function getExistingWebsites(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return new Set();
  const data = sheet.getDataRange().getValues();
  return new Set(data.slice(1).map(r => r[0].toString().toLowerCase().trim()));
}

// Helper to clean AI markdown formatting
function cleanJsonResponse(rawText) {
  return rawText.replace(/```json|```/g, "").trim();
}


// Standardizes URLs for use as a Primary Key.
function normalizeUrl(url) {
  if (!url) return "";
  let clean = url.toLowerCase().trim();
  clean = clean.replace(/^https?:\/\//, ""); // Remove protocol
  clean = clean.replace(/^www\./, "");      // Remove www
  clean = clean.replace(/\/$/, "");         // Remove trailing slash
  return clean;
}


// Logs events to a plain text file in Google Drive.

function logToDrive(message, level = "INFO") {
  const fileName = "startup_scouter_logs.txt";
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  let file;
  const files = DriveApp.getFilesByName(fileName);
  
  if (files.hasNext()) {
    file = files.next();
    const existingContent = file.getBlob().getDataAsString();
    file.setContent(existingContent + logEntry);
  } else {
    file = DriveApp.createFile(fileName, logEntry);
  }
}

// Removes surrounding quotes and extra whitespace from AI responses.

function sanitizeAiResponse(text) {
  if (!text) return "";
  let clean = text.trim();
  // Remove leading/trailing double quotes
  clean = clean.replace(/^"|"$/g, '');
  // Remove leading/trailing single quotes
  clean = clean.replace(/^'|'$/g, '');
  return clean.trim();
}