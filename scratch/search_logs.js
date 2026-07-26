const fs = require('fs');
const file = 'C:\\Users\\Heet\\.gemini\\antigravity-ide\\brain\\7b7c5079-73a8-483f-8a9e-32f82e91be3d\\.system_generated\\logs\\transcript_full.jsonl';

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  let index = 0;
  while ((index = content.indexOf('"logs"', index)) !== -1) {
    console.log(`\nFound logs at ${index}:`);
    console.log(content.substring(index - 200, index + 800));
    index += '"logs"'.length;
  }
} else {
  console.log("No file");
}
