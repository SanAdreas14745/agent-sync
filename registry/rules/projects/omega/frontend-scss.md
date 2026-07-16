---
id: project.omega.frontend-scss
kind: rule
title: Omega Frontend SCSS Rules
summary: Проектные SCSS-правила Omega.
scope: project
loadMode: project
status: active
category: scss
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["omega"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["angular"]
---

## Правила

- В Omega избегай `px`; используй проектный `px-to-rem` helper.
