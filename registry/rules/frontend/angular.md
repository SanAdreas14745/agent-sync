---
id: frontend.angular
kind: rule
title: Frontend Angular Rules
summary: Angular-правила для frontend-приложений.
scope: team
loadMode: project
status: active
category: frontend
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["angular"]
---

## Правила

- Сохраняй существующее направление дизайна, если задача не является редизайном.
- Делай UI-изменения responsive для desktop и mobile.
- Избегай generic и boilerplate-looking layouts.
- Предпочитай осмысленную типографику, spacing, hierarchy и доступный contrast.
- Держи стили компонента рядом с компонентом, если global styling не является намеренным.
- Предпочитай `inject()` для Angular DI вместо constructor injection.
- Если legacy constructor остается, не добавляй в него initialization effects или method calls.
- Инициализируй Angular effects по паттерну: lifecycle hook содержит только вызов class method, а этот method создает `effect(...)` с `inject(Injector)`.
- Называй custom Angular output events с префиксом `$` и суффиксом `Event`, например `$closeEvent` или `$submitEvent`.
- Называй обработчики пользовательских действий с префиксом `on`, например `onButtonClick`, `onSave`, `onCloseClick`.
- Не пиши `standalone: true` в Angular `@Component`; это значение по умолчанию.
- Новые компоненты должны использовать `ChangeDetectionStrategy.OnPush`.
- Если редактируешь legacy component, сразу убирай `standalone: true` и убирай constructor usage там, где это практично.
