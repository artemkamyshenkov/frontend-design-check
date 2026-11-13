# Разработка

Корень репозитория содержит скилл и `manifest.yaml` для Skill Store. Рабочие скрипты и тесты находятся в `scripts/`.

Проверка генератора отчёта и планирования захвата требует Node.js 18+.

```sh
node --test scripts/test_report.cjs scripts/test_capture_plan.cjs
```

Интеграционные тесты требуют Playwright и установленный Google Chrome. Укажите путь к пакету Playwright, если он установлен вне репозитория.

```sh
PLAYWRIGHT_MODULE_PATH=/путь/к/node_modules/playwright node --test scripts/test_capture_browser.cjs scripts/test_report_browser.cjs
```

## Публикация в Skill Store

Попросите агента обновить `frontend-design-check` в Skill Store из этой папки. В пакет входят `manifest.yaml`, `README.md`, `SKILL.md`, папки `agents/`, `references/` и рабочие скрипты `scripts/build_report.cjs`, `scripts/capture_playwright.cjs`. Файлы `scripts/test_*.cjs` и этот документ предназначены для разработки и не входят в опубликованный пакет.

Перед публикацией проверьте предпросмотр изменений и предупреждения Store. После подтверждения Store обновит существующий скилл. Для проверки установки используйте отдельное окружение.
