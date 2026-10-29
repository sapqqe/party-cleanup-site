# Party Cleanup! — сайт игры

[![Deploy static site](https://github.com/sapqqe/party-cleanup-site/actions/workflows/deploy.yml/badge.svg)](https://github.com/sapqqe/party-cleanup-site/actions/workflows/deploy.yml)

Лендинг моей игры для Roblox «Party Cleanup!»: https://sapqqe.github.io/party-cleanup-site/

Сайт без сборщиков: `index.html`, `style.css`, `main.js` и картинки в `assets/` и `images/`.

## Как сайт попадает в интернет

При каждом push в `main` GitHub Actions запускает workflow `.github/workflows/deploy.yml`:

1. **Проверка** — линтер HTML (`html-validate`, правила в `.htmlvalidate.json`) и скрипт
   `scripts/check-files.mjs`, который ищет ссылки на несуществующие картинки и файлы.
2. **Сборка** — в папку `_site` копируются только файлы сайта.
3. **Публикация** — на GitHub Pages, только если проверка прошла.

Для Pull Request выполняется только проверка: ошибка видна до слияния, а сайт не меняется.
Значок выше показывает результат последнего запуска.

Проверить локально (нужен Node.js):

```
npx html-validate@9.4.1 index.html
node scripts/check-files.mjs
```
