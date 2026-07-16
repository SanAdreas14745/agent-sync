---
id: reference.project.omega.context
kind: reference
title: Omega Project Context
summary: Базовый контекст проекта Omega.
scope: project
loadMode: reference
status: active
category: general
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-10
appliesTo:
  projects: ["omega"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
---

## Контекст

- Репозиторий содержит Angular frontend и NestJS BFF приложения, использующие npm.
- Для поиска используй `rg`, а для поиска файлов — `rg --files`.
- Frontend-правила применяются к `apps/front`.
- BFF-правила применяются к NestJS-приложениям frontend-зоны ответственности, например `apps/bff` и `apps/ma-api-gateway`, если они присутствуют.
