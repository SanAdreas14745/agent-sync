---
id: frontend.common
kind: rule
title: Frontend Common Rules
summary: Общие frontend-правила для репозиториев команды.
scope: team
loadMode: project
status: active
category: frontend
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["typescript", "angular"]
---

## Правила

- Не ослабляй строгие настройки TypeScript.
- Предпочитай небольшие явные модули со стабильными контрактами.
- Добавляй точечные тесты, если меняется поведение.
