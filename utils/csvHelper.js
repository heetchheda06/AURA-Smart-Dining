/**
 * CSV Helper Utility - RFC 4180 compliant parsing & generation
 */

/**
 * Parse raw CSV string into an array of JavaScript objects.
 * Handles quoted fields, commas inside quotes, double quote escapes, and CRLF/LF line endings.
 * @param {string} csvText 
 * @returns {Array<Object>}
 */
function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = [];
  let currentField = '';
  let currentLine = [];
  let inQuotes = false;
  
  // Normalize line endings to \n
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("")
          currentField += '"';
          i++;
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentLine.push(currentField.trim());
        lines.push(currentLine);
        currentField = '';
        currentLine = [];
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & line if any remaining
  if (currentField.length > 0 || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    lines.push(currentLine);
  }

  // Filter empty lines
  const validLines = lines.filter(line => line.length > 0 && line.some(cell => cell !== ''));

  if (validLines.length < 2) return [];

  const headers = validLines[0].map(h => h.replace(/^"(.*)"$/, '$1').trim());
  const records = [];

  for (let l = 1; l < validLines.length; l++) {
    const row = validLines[l];
    const record = {};
    headers.forEach((header, index) => {
      let val = row[index] !== undefined ? row[index] : '';
      // Strip surrounding quotes if present
      if (typeof val === 'string') {
        val = val.replace(/^"(.*)"$/, '$1');
      }
      
      // Auto cast numbers or booleans if applicable
      if (val !== '' && !isNaN(val)) {
        val = Number(val);
      } else if (val.toLowerCase() === 'true') {
        val = true;
      } else if (val.toLowerCase() === 'false') {
        val = false;
      }
      
      record[header] = val;
    });
    records.push(record);
  }

  return records;
}

/**
 * Convert an array of objects into a formatted CSV string.
 * @param {Array<Object>} data 
 * @param {Array<string>} [fields] - Optional explicit order of columns/headers
 * @returns {string}
 */
function generateCSV(data, fields) {
  if (!Array.isArray(data) || data.length === 0) {
    if (fields && fields.length > 0) {
      return fields.join(',') + '\n';
    }
    return '';
  }

  const headers = fields || Object.keys(data[0]);

  const escapeCSVCell = (val) => {
    if (val === null || val === undefined) return '""';
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    } else {
      val = String(val);
    }
    // If cell contains comma, double-quote, or newline, wrap in quotes & escape inner quotes
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return `"${val}"`;
  };

  const headerRow = headers.map(h => escapeCSVCell(h)).join(',');
  const rows = data.map(item => {
    return headers.map(h => escapeCSVCell(item[h])).join(',');
  });

  return [headerRow, ...rows].join('\r\n') + '\r\n';
}

module.exports = {
  parseCSV,
  generateCSV
};
