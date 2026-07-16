---
id: project.storybook.frontend-components
kind: rule
title: StoryBook Frontend Component Rules
summary: Project-specific Angular component and shared-library rules for StoryBook.
scope: project
loadMode: project
status: active
category: frontend
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

- Every new Angular component must be associated with `pb-base-component`, normally by extending `BaseComponent`.
- For DOM rendered outside the component host, such as an overlay with `appendTo="body"`, add `pb-base-component` explicitly to the rendered element's `styleClass`.
- Do not modify existing shared components for a narrow feature unless the change is clearly required for that component's public API and approved for the broader library.
