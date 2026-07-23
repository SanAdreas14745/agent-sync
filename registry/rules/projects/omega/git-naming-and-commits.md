---
id: project.omega-brandapp.git-naming-and-commits
kind: rule
title: Omega And BrandApp Git Naming And Commits
summary: Правила именования веток и commit-сообщений для Omega и BrandApp.
scope: project
loadMode: project
status: active
category: git
severity: recommended
version: 2
owner: frontend
updatedAt: 2026-07-23
appliesTo:
  projects: ["omega", "brandapp"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
---

## Правила

- Новые ветки должны использовать формат `<task-number>-<task-type>-<scope>-<short-description>`.
- Номер задачи должен стоять в начале имени ветки и писаться в нижнем регистре: `<project-key>-<number>`. Используй ключ соответствующего проекта, например `om-1855` для Omega.
- Тип задачи обязателен и должен быть одним из значений: `bug`, `feature`, `refactoring`. Выбирай тип внимательно, потому что от него зависит CI automation.
- `scope` обозначает продуктовую область или shared-сущность, например `agreements`.
- Краткое описание должно быть concise kebab-case summary задачи.
- Пример имени ветки: `om-1855-feature-agreements-creating-route-and-tabs`.
- Commit-сообщения должны использовать формат `<task-number>: <task title>`.
- Номер задачи в commit-сообщении пишется в верхнем регистре: `<PROJECT-KEY>-<number>`, например `OM-1855: Соглашения [1]. Создание маршрута и табов`.
