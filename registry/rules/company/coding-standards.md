---
id: company.coding-standards
kind: rule
title: Company Coding Standards
summary: Общие стандарты кода для поддерживаемых репозиториев.
scope: company
loadMode: project
status: active
category: general
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
---

## Правила

- Предпочитай небольшие сфокусированные изменения с понятной целью.
- Используй описательные имена для functions, variables и files.
- Добавляй краткие комментарии на русском только там, где неочевидная логика требует контекста.
- Обновляй user-facing documentation, если меняется поведение.
- Debug calls (`console.log`, `console.debug`) и `debugger` должны быть удалены перед commit. `console.warn` и `console.error` разрешены.
- Multi-line comments и commented-out code blocks разрешены, если они намеренные и полезны для текущей задачи. Перед push или commit сообщи пользователю их точные locations.
- `// TODO:` comments разрешены и не считаются нарушением.
- Пиши methods и functions вокруг одной основной ответственности. Если независимый логический блок можно назвать понятным domain name и extraction улучшает readability или testability, вынеси его в отдельный method/function.
- Размер сам по себе не является нарушением: methods/functions на 20+ строк — только сигнал проверить наличие независимых логических блоков.