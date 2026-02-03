// Creates the custom menu when the Google Sheet is opened.
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Startup Scouting AI')
      .addItem('1. Scout Accelerators', 'scoutAccelerators')
      .addItem('2. Update Startups from Accelerator Portfolios', 'updateStartupsFromAccelerators')
      .addItem('3. Generate Value Propositions (fill missing values)', 'generateValueProps')
      .addToUi();
}

//  ACTION 1: Scouts top-tier European accelerators.
 
function scoutAccelerators() {
  logToDrive("Starting Accelerator Scouting run...", "INFO");
  
  try {
    const sheet = getOrCreateSheet('accelerators');
    const existingKeys = getExistingWebsites('accelerators');
    
    const response = callGemini(`Act as a senior Venture Capital analyst. 
Scout 10 high-growth startup accelerators based in Europe (e.g., Station F, Maria 01, H-FARM).

For the 'country' field, strictly follow these rules:
1. Identify the headquarters country (e.g., "France", "Finland", "Italy").
2. If the accelerator is pan-European, use the city of their main hub.
3. NEVER leave the country field empty or "Unknown". If unsure, use the TLD of the website (e.g., .de = Germany).

Format the output ONLY as a valid JSON array of objects:
[
  {"website": "https://url.com", "name": "Name", "country": "Country Name"}
]`);
    const data = JSON.parse(cleanJsonResponse(response));

    let addedCount = 0;
    data.forEach(acc => {
      const key = acc.website.toLowerCase().trim();
      if (!existingKeys.has(key)) {
        sheet.appendRow([acc.website, acc.name, acc.country]);
        existingKeys.add(key);
        addedCount++;
      }
    });

    logToDrive(`Scouting successful, added ${addedCount} accelerators`, "INFO");
    SpreadsheetApp.getUi().alert(`Added ${addedCount} accelerators. Check the logs for details.`);

  } catch (e) {
    logToDrive("CRITICAL ERROR: " + e.message, "ERROR");
    SpreadsheetApp.getUi().alert("Execution failed. See the 'logs' tab.");
  }
}


// ACTION 2: Scrapes accelerator websites to find portfolio startups.

function updateStartupsFromAccelerators() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const accSheet = ss.getSheetByName('accelerators');
  const startupSheet = getOrCreateSheet('startups');
  
  if (!accSheet) {
    SpreadsheetApp.getUi().alert("Please run 'Scout Accelerators' first.");
    return;
  }

  const accData = accSheet.getDataRange().getValues().slice(1); 
  const existingStartups = getExistingWebsites('startups');

  accData.forEach(row => {
    const accUrl = row[0];
    const accName = row[1];

    try {
      // Fetch small snippet of HTML for context
      const html = UrlFetchApp.fetch(accUrl, {muteHttpExceptions: true}).getContentText().substring(0, 5000);
      
      const prompt = `Analyze this HTML from the accelerator "${accName}" (URL: ${accUrl}). 
      Identify 3 unique portfolio startups.
          
      CRITICAL CONSTRAINTS:
      1. DO NOT include "${accName}" or any of its sub-brands as a startup.
      2. DO NOT include the URL "${accUrl}" or its domain as a startup website.
      3. Only include third-party companies that have been funded or accelerated by them.
      4. If the HTML is insufficient, just input the string "further analysis needed".
          
      Use this schema for the value proposition:
      Format: "Startup [Name] helps [Target] do [Action] so that [Benefit]."
          
      Format ONLY as JSON:
      [{"name": "Startup", "website": "URL", "country": "Country", "value_prop": "value proposition"}]
          
      HTML: ${html}`;

      

      const rawJson = callGemini(prompt);
      const newStartups = JSON.parse(cleanJsonResponse(rawJson));

      newStartups.forEach(s => {
        const cleanUrl = s.website.toLowerCase().trim();
        if (!existingStartups.has(cleanUrl)) {
          // Columns: Website, Name, Country, Source, Value Prop
          startupSheet.appendRow([s.website, s.name, s.country, accName, s.value_prop]);
          existingStartups.add(cleanUrl);
        }
      });
       logToDrive(`Scouting successful, added ${newStartups.length} startups from ${accName}`, "INFO");
    } catch (e) {
      logToDrive("CRITICAL ERROR: " + e.message, "ERROR");
    }
  });
  SpreadsheetApp.getUi().alert("Startups updated!");
}

// ACTION 3: Target specific rows requiring deep analysis.
// Scrapes individual startup websites to resolve "further analysis needed" flags.
 
function generateValueProps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('startups');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const triggerText = "further analysis needed";
  let processedCount = 0;

  logToDrive("Action 3: Checking formatting and flags...", "INFO");

  for (let i = 1; i < data.length; i++) {
    const url = data[i][0];
    const name = data[i][1];
    const cellValue = data[i][4] ? data[i][4].toString().trim() : "";

    // TRIGGER LOGIC:
    // 1. Cell is empty
    // 2. Cell contains the "further analysis" flag
    // 3. Cell value exists but doesn't start with "Startup"
    const needsProcessing = cellValue === "" || 
                             cellValue.toLowerCase().includes(triggerText) || 
                             !cellValue.startsWith("Startup");

    if (!needsProcessing) continue;

    try {
      logToDrive(`Action 3: Deep scraping ${name} to fix formatting/data.`, "DEBUG");
      
      const response = UrlFetchApp.fetch(url, {muteHttpExceptions: true, timeoutInSeconds: 20});
      const html = response.getContentText().substring(0, 8000);
      
      const prompt = `Write a one-sentence value proposition for the startup "${name}" using this HTML.
      STRICT FORMAT: You must start the sentence with "Startup ${name} helps..."
      Example: Startup ${name} helps [Target] do [Action] so that [Benefit].
      
      HTML: ${html}`;

      let vp = callGemini(prompt);

      // Extract from JSON if necessary
      try {
        const parsed = JSON.parse(vp);
        vp = parsed.value_prop || parsed.value_proposition || vp;
      } catch (e) {
        vp = cleanJsonResponse(vp);
      }

      // Sanitize quotes and whitespace
      vp = sanitizeAiResponse(vp);

      // Final check: If the AI STILL didn't add "Startup", force it manually
      if (!vp.startsWith("Startup")) {
        vp = `Startup ${vp}`;
      }

      sheet.getRange(i + 1, 5).setValue(vp);
      processedCount++;
      
    } catch (e) {
      logToDrive(`Action 3 Error for ${name}: ${e.message}`, "ERROR");
    }
  }

  logToDrive(`Action 3 complete. Cleaned/Resolved ${processedCount} rows.`, "INFO");
  SpreadsheetApp.getUi().alert(`Format check complete. Updated ${processedCount} rows.`);
}