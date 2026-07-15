---
id: reference.project.omega.verification-commands
kind: reference
title: Omega Verification Commands
summary: Команды проверки для приложений проекта Omega.
scope: project
loadMode: reference
status: active
category: verification
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["omega"]
  agents: ["codex"]
---

## Команды Проверки

Для агента предпочтительно запускать команды через `workdir` соответствующего приложения, например `workdir=apps/front` и `npm.cmd run build`.

### apps/front

- Build/typecheck: `npm.cmd run build`.
- Lint: `npm.cmd run lint`.
- Tests: `npm.cmd test`.
- Если изменение затрагивает только static text или markdown, можно пропустить build/test/lint, но нужно объяснить это в финальном отчете.

### apps/bff

- Build/typecheck: `npm.cmd run build`.
- Lint: `npm.cmd run lint`.
- Tests: `npm.cmd test`.
- Swagger file: `npm.cmd run build-swagger-file`.
- После изменения BFF Swagger contracts не запускай frontend API generation и не редактируй generated frontend API files.
- В финальном отчете укажи, что BFF готов для frontend generation.
