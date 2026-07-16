---
id: frontend.scss
kind: rule
title: Frontend SCSS Rules
summary: SCSS-правила для Angular frontend-приложений.
scope: team
loadMode: project
status: active
category: scss
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["angular"]
---

## Правила

- Считай component selector class BEM-like block. Element classes пиши с prefix selector и suffix `_element`; предпочитай one-level SCSS nesting под block через `&`, например `.app-account-agreements { &_title { ... } }`.
- Разделяй каждую class и nested class пустой строкой.
- Для local component/feature SCSS imports используй namespaced `@use`, например `@use 'utils' as utils;`; не используй `@use ... as *`, потому что он слишком расширяет область видимости.
- Предпочитай utility classes из подключенной utility library перед inline styles и custom SCSS для типовых layout-свойств.
- Не пиши styles для default values вроде `display: block`, `position: static`, `flex-direction: row`, `align-items: stretch` и похожих defaults.
- Избегай дублирования styles, уже покрытых utility classes (`flex`, `gap`, `margin`, `padding` и т.д.).
- Custom classes должны идти первыми в `class` attribute, перед library и utility classes.
- Class names, кроме modifier classes, должны начинаться с component selector, затем underscore и informative name. Пример: selector `layout-topbar` -> class `layout-topbar_body`.
- Все classes в одном component должны начинаться с его selector независимо от nesting depth. Исключение: custom modifier classes или общие миксины.
- Modifier class добавляется к child block внутри selector-class container, не несет complex logic и должна начинаться с `__`, например `__color-save-icon`.
- Внутри `ng-deep` modifier classes, начинающиеся с `__`, запрещены.
- Оборачивай все component markup styles в `:host {}`.
- Повторяющиеся или нагруженные блоки component styles выноси в feature-level SCSS mixins рядом с feature, например `styles/_<feature-name>.mixin.scss`, чтобы не переполнять основной component SCSS.
- Для тяжелых library overrides, `::ng-deep` blocks и повторяющихся visual states предпочитай local mixin + `@use` / `@include`, а не дублирование или длинный inline-блок в component SCSS.
