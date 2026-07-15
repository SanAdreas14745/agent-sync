---
id: company.dependency-changes
kind: rule
title: Company Dependency Changes
summary: Правила изменения зависимостей.
scope: company
loadMode: project
status: active
category: dependencies
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
---

## Правила

- Не добавляй пакеты, если они существенно не упрощают решение.
- Если зависимость нужна, объясни, почему существующих project dependencies недостаточно.
- Держи lockfile согласованным с package manifest.
