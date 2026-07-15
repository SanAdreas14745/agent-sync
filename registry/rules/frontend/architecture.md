---
id: frontend.architecture
kind: rule
title: Frontend Architecture Rules
summary: Правила организации frontend-кода и route screen структуры.
scope: team
loadMode: project
status: active
category: architecture
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
  technologies: ["angular"]
---

## Правила

- Переноси reusable data structures, state, value sets и configuration в отдельные entities.
- Не храни types, enums, configs, interfaces и похожие entities рядом с component/service classes; переноси их в подходящие local или shared directories.
- Держи components clean. Выноси business logic, API calls, complex transformations и reusable logic в services, directives, utilities или другие подходящие entities.
- Для domain с несколькими route screens, например list/create/view/edit, используй route-shell component, который содержит только layout-neutral container и `router-outlet`.
- Храни domain child routes в локальном `routes.ts` рядом с route-shell и подключай domain из product route через lazy `loadChildren`.
- Конкретные route screens размещай в domain `pages` directory. Reusable domain parts, включая page layouts, размещай в `components`.
- Route-shell и layout components не должны владеть API calls, business state или screen-specific behavior.
- Если связанные route screens разделяют page composition, создай локальный layout component с named content-projection zones, например `layoutHeader`, `layoutContent` и optional domain-specific zones.
- Layout component отвечает за outer dimensions, borders, responsive grid/flex composition, section dividers и scrolling.
- Route pages отвечают за titles, actions, tabs, forms, tables и другой screen content.
- Configs, enums, interfaces, types и constants, относящиеся к одному route screen, держи рядом с этим screen. Поднимай их в domain или shared scope только при реальном reuse.
