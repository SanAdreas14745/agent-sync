---
id: company.verification
kind: rule
title: Company Verification Rules
summary: Общие правила проверки изменений.
scope: company
loadMode: project
status: active
category: verification
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
---

## Правила

- После изменений в коде предпочитай запускать build/typecheck, если изменение может затронуть behavior или TypeScript.
- Запускай тесты, когда тесты релевантны или меняется поведение.
- Если изменилась только formatting, static text или markdown, объясни, почему более тяжелая проверка была пропущена.
- В PowerShell используй `npm.cmd` для npm-команд, если `npm.ps1` заблокирован execution policy.
- Для проектных команд проверки открывай релевантный reference из `skill-index.json`, если он доступен для текущего проекта.
