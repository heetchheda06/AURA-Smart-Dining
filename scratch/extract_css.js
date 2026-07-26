const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const startTag = '<style>';
const endTag = '</style>';

const startIndex = html.indexOf(startTag);
if (startIndex === -1) {
  console.log("Could not find <style> tag");
  process.exit(1);
}

const endIndex = html.indexOf(endTag, startIndex);
if (endIndex === -1) {
  console.log("Could not find </style> tag");
  process.exit(1);
}

const cssContent = html.substring(startIndex + startTag.length, endIndex);
fs.writeFileSync('client/src/index.css', cssContent.trim());
console.log("CSS successfully extracted to client/src/index.css!");
