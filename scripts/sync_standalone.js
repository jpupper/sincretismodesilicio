import fs from 'fs';

fs.copyFileSync('public/game3/style.css', 'cyber-hijack/style.css');
fs.copyFileSync('public/game3/script.js', 'cyber-hijack/script.js');

let html = fs.readFileSync('public/game3/index.html', 'utf-8');
html = html.replace('  <base href="/game3/">\r\n', '').replace('  <base href="/game3/">\n', '');
fs.writeFileSync('cyber-hijack/index.html', html, 'utf-8');

console.log('Successfully synced cyber-hijack files!');
