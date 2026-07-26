const fs = require('fs');
const file = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain\\7b7c5079-73a8-483f-8a9e-32f82e91be3d\\.system_generated\\logs\\transcript_full.jsonl';

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`Searching in ${lines.length} lines...`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('capture_browser_console_logs') && line.includes('"status":"DONE"')) {
      console.log(`Line ${i}:`);
      // print first 2000 chars of the line
      console.log(line.substring(0, 2000));
    }
  }
} else {
  console.log("No file");
}
