---
id: frontend.html
kind: rule
title: Frontend HTML Rules
summary: Angular HTML/template правила для frontend-приложений.
scope: team
loadMode: project
status: active
category: html
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
  technologies: ["angular"]
---

## Правила

- В templates предпочитай проектные UI-kit components. Если подходящего UI-kit component нет, используй подключенную component library. Native HTML tags используй только когда ни одна библиотека не подходит.
- Используй double quotes для attributes и single quotes для string values внутри Angular expressions.
- Если у tag больше одного attribute, размещай каждый attribute на отдельной строке.
- Порядок attributes: template reference, structural directives / control flow, string parameters, non-string parameters, two-way bindings, event handlers.
- Не выноси button labels, placeholders, empty messages и другие user-facing template strings из templates без сильной необходимости или предварительного approval. Сильная необходимость — строка очень длинная, больше 100 символов.
- Если tag содержит вложенный tag, component или Angular control-flow block, размещай parent и child на отдельных строках с отступами; не пиши вложенную разметку в одну строку.
- Для conditional rendering используй Angular control flow: `@if` вместо `*ngIf`, `@for` вместо `*ngFor`, `@switch` / `@case` вместо `ngSwitch`. Использование старых structural directives в новом коде является нарушением.
- Components without content должны быть self-closing.
- Repeated large или independent blocks нужно выносить в отдельные components. Small repeated blocks можно выносить в `ng-template`.
- Sibling tags внутри одного parent должны разделяться пустой строкой, кроме двух коротких one-line tags рядом.
