// Проверяет, что все картинки и файлы, на которые ссылается сайт, есть в репозитории.
// Запуск: node scripts/check-files.mjs  (код выхода 1, если что-то не найдено)
import { readFileSync, existsSync } from 'node:fs';

const sources = {
  'index.html': /(?:src|href|content)="([^"#:?]+\.(?:webp|png|jpe?g|svg|css|js))"/g,
  'style.css': /url\(["']?([^"')#:?]+\.(?:webp|png|jpe?g|svg|woff2?))["']?\)/g,
  'main.js': /["'`]((?:assets|images)\/[^"'`]+\.(?:webp|png|jpe?g|svg))["'`]/g,
};

let checked = 0;
const missing = [];
for (const [file, pattern] of Object.entries(sources)) {
  const text = readFileSync(file, 'utf8');
  for (const [, path] of text.matchAll(pattern)) {
    if (path.startsWith('data:') || path.startsWith('//')) continue;
    checked++;
    if (!existsSync(path)) missing.push(`${file}: ${path}`);
  }
}

if (missing.length) {
  console.error(`Не найдено файлов: ${missing.length}`);
  for (const m of missing) console.error('  ✗ ' + m);
  process.exit(1);
}
console.log(`Все ссылки на файлы на месте: ${checked}`);
