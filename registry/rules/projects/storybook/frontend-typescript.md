---
id: project.storybook.frontend-typescript
kind: rule
title: StoryBook Frontend TypeScript Rules
summary: Project-specific Angular TypeScript and signal rules for StoryBook.
scope: project
loadMode: project
status: active
category: typescript
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-13
appliesTo:
  projects: ["storybook"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["typescript", "angular"]
---

## Rules

- Keep TypeScript formatting aligned with the project ESLint stylistic rules, including blank lines between class members and before control-flow exits such as `return`.
- If a computed signal body takes more than two lines, move the body to a private method named `computed` plus the variable name without the `$` prefix in PascalCase. Example: `$resolvedToolbarButtons` uses `computedResolvedToolbarButtons`.
- Do not initialize Angular `effect()` in property declarations. Inject `Injector` with `inject(Injector)`, create the effect from `ngOnInit()` through a private init method, and pass `{ injector: this.injector }`.
