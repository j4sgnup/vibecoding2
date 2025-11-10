import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../dist/index.html');
const buildDate = new Date().toISOString();

let html = fs.readFileSync(filePath, 'utf8');
html = html.replace('__BUILD_DATE__', buildDate);
fs.writeFileSync(filePath, html);

console.log('Build date injected:', buildDate);
