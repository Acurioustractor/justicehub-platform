import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('output/campaign-hub/index.html', 'utf-8');
const staticData = readFileSync('output/campaign-hub/static-v2-data.js', 'utf-8');

// Find and replace the old STATIC_PHOTOS block
// It starts with "// Static photo library —" and ends before "// Photos loaded dynamically"
const startMarker = '// Auto-generated from EL v2';
const endMarker = '// Photos loaded dynamically';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers in HTML');
  console.log('startMarker found:', startIdx !== -1);
  console.log('endMarker found:', endIdx !== -1);
  process.exit(1);
}

// Build replacement: static data from v2 API + the "Photos loaded dynamically" line
const newHtml = html.substring(0, startIdx) + staticData + '\n' + html.substring(endIdx);

writeFileSync('output/campaign-hub/index.html', newHtml);
console.log('Replaced static data in index.html');
console.log(`Old size: ${html.length} chars`);
console.log(`New size: ${newHtml.length} chars`);
