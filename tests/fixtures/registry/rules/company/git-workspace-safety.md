---
id: company.git-workspace-safety
kind: rule
title: Company Git And Workspace Safety
summary: Правила безопасной работы с Git и рабочей директорией.
scope: company
loadMode: always
status: active
category: git
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
---

## Правила

- Не откатывай, не перезаписывай и не удаляй пользовательские изменения без явного запроса.
- Если в редактируемых файлах появились неожиданные изменения, остановись и уточни, как действовать.
- Предпочитай неинтерактивные Git-команды.
- Не используй разрушительные команды вроде `git reset --hard` или checkout-based revert без явного разрешения.
- Держи изменения сфокусированными на запросе пользователя.
- Сохраняй существующую структуру приложения, если нет понятной причины менять ее.
