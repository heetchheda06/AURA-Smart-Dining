const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');

// Find script tag
const startTag = '<script>';
const endTag = '</script>';

// Find the main script block. Since there are multiple script tags, let's find the one containing the state management
const startIndex = html.indexOf('const menuData = [];');
if (startIndex === -1) {
  console.log("Could not find the script block containing 'const menuData = [];'");
  process.exit(1);
}

// Find the closing script tag after it
const endIndex = html.indexOf(endTag, startIndex);
if (endIndex === -1) {
  console.log("Could not find closing script tag");
  process.exit(1);
}

const jsCode = html.substring(startIndex, endIndex);

try {
  new vm.Script(jsCode);
  console.log("JavaScript syntax is completely VALID!");
} catch (err) {
  console.log("JavaScript syntax error found!");
  console.error(err.stack);
}
