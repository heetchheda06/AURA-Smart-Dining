const fs = require('fs');

const file = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain\\cece07cb-b47a-411b-bd21-b4ad11ce6f2d\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(file)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  console.log(`Total lines: ${lines.length}`);
  for (const line of lines) {
    if (line.includes('capture_browser_console_logs') || line.includes('ReferenceError') || line.includes('TypeError') || line.includes('google')) {
      console.log(`\n--- LINE ---`);
      console.log(line.substring(0, 1500));
    }
  }
} else {
  console.log("File not found: " + file);
}
