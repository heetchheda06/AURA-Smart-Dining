const fs = require('fs');
const path = require('path');

const rootSearch = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain';
const oneHourAgo = Date.now() - 60 * 60 * 1000;

function scanDir(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, files);
    } else if (item.endsWith('.jsonl')) {
      if (stat.mtimeMs > oneHourAgo) {
        files.push({ path: fullPath, mtime: stat.mtime });
      }
    }
  }
  return files;
}

const recentFiles = scanDir(rootSearch);
console.log(`Found ${recentFiles.length} recent log files modified in the last hour:`);
recentFiles.forEach(rf => {
  console.log(`- ${rf.path} (${rf.mtime})`);
  // Let's print any console logs in it
  const lines = fs.readFileSync(rf.path, 'utf8').split('\n');
  for (const line of lines) {
    if (line.includes('capture_browser_console_logs') && line.includes('"type":"TOOL_RESPONSE"')) {
      try {
        const parsed = JSON.parse(line);
        console.log(`  -> Found capture_browser_console_logs:`);
        console.log(parsed.content.substring(0, 1500));
      } catch (e) {
        console.log(`  -> Raw line snippet: ${line.substring(0, 300)}`);
      }
    }
  }
});
