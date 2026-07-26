const fs = require('fs');
const path = require('path');

const rootSearch = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain';

function findJsonlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJsonlFiles(fullPath, files);
    } else if (item.endsWith('.jsonl')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = findJsonlFiles(rootSearch);
console.log(`Scanning ${allFiles.length} files...`);

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('capture_browser_console_logs')) {
    console.log(`Found tool call in: ${file}`);
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('capture_browser_console_logs') && line.includes('"content":')) {
        // Try parsing
        try {
          const parsed = JSON.parse(line);
          console.log(`--- RESPONSE ---`);
          console.log(parsed.content);
        } catch (e) {
          // If it is truncated in transcript.jsonl, read it as text
          console.log(`Raw: ${line.substring(0, 1000)}`);
        }
      }
    }
  }
}
