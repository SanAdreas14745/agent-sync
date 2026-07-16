---
id: project.brandapp.bff-nestjs
kind: rule
title: BrandApp BFF NestJS Rules
summary: Проектные правила BrandApp для NestJS BFF.
scope: project
loadMode: project
status: active
category: bff
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["brandapp"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["nestjs"]
---

## Правила

- В BrandApp BFF следуй контракту локального `ApiService`, который принимает props без отдельного backend project name.
- Для защищенных controller повторяй project pattern с `IdGuard`, если соседние endpoints этого module используют guard.
- Для shared imports предпочитай существующие aliases вроде `@apps/shared` и `@apps/auth`, если они уже используются рядом.
- Для ошибок следуй локальному pattern соседнего service: `tokenNotValidError(...)` и typed Nest exception, пока module не переведен на общий error handler.
- Если `ApiService` возвращает raw `response.data`, нормализуй casing и response shape внутри feature service перед возвратом controller.
