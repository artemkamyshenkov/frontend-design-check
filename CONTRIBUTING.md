# Разработка

Корень репозитория содержит скилл и его метаданные в `manifest.yaml`. Рабочие скрипты и тесты находятся в `scripts/`.

Проверка генератора отчёта и планирования захвата требует Node.js 18+.

```sh
node --test scripts/test_report.cjs scripts/test_capture_plan.cjs
```

Интеграционные тесты требуют Playwright и установленный Google Chrome. Укажите путь к пакету Playwright, если он установлен вне репозитория.

```sh
PLAYWRIGHT_MODULE_PATH=/путь/к/node_modules/playwright node --test scripts/test_capture_browser.cjs scripts/test_report_browser.cjs
```
