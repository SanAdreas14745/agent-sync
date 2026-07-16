---
id: project.storybook.frontend-scss
kind: rule
title: StoryBook Frontend SCSS Rules
summary: Project-specific styling rules for StoryBook.
scope: project
loadMode: project
status: active
category: scss
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

- Prefer design tokens and CSS variables for colors, for example `var(--p-surface-100)`, when a matching token exists.
- Prefer PrimeFlex classes before inline styles for common layout utilities: `flex`, `flex-column`, `w-full`, `h-full`, `gap-X`, `p-X`, `absolute`, `relative`, `justify-content-between`, `align-items-center`, and `overflow-y-auto`.
