---
id: project.storybook.frontend-html
kind: rule
title: StoryBook Frontend HTML Rules
summary: Project-specific Angular template rules for StoryBook.
scope: project
loadMode: project
status: active
category: html
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-13
appliesTo:
  projects: ["storybook"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["angular"]
---

## Rules

- In Angular templates, use `pb-ui-kit` components first, PrimeNG components second, and native HTML elements only when neither library provides a suitable component.
- Do not use native interactive HTML elements when this library already provides an equivalent component.
- Use `pb-button` by default for buttons. If a native `<button>` is necessary, explicitly document why in the implementation notes.
- Keep Angular template attributes and bindings in the order expected by `@angular-eslint/template/attributes-order`.
- Do not replace Russian UI text with Unicode escape sequences like `\u0417`; write readable Cyrillic text directly.
