---
id: project.brandapp.frontend-scss
kind: rule
title: BrandApp Frontend SCSS Rules
summary: Проектные SCSS-правила BrandApp.
scope: project
loadMode: project
status: active
category: scss
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["brandapp"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["angular"]
---

## Правила

- В BrandApp избегай `px`; используй проектный `px-to-rem` helper.
