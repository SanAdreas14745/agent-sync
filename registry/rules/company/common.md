---
id: company.common
kind: rule
title: Company Common Rules
summary: Базовые правила для всех поддерживаемых репозиториев.
scope: company
loadMode: always
status: active
category: general
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
---

## Правила

- Держи изменения в рамках поставленной задачи.
- Не меняй несвязанный с задачей код молча. Если для адекватного решения нужно переписать существующий код или затронуть соседнюю область, сначала согласуй это с пользователем и явно опиши, на какие behavior, tests, contracts или modules это может повлиять.
- Предпочитай существующие соглашения проекта новым абстракциям.
