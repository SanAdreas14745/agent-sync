# Структура Проверки Registry Material

Этот reference описывает подробные критерии проверки `rule`, `skill` и
`reference` в AgentSync registry.

## Общие Frontmatter Требования

Каждый registry material должен иметь:

``` yaml
id: frontend.typescript
kind: rule
title: Frontend TypeScript Rules
summary: Краткое назначение material.
scope: team
loadMode: project
status: active
category: typescript
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
```

Запрещено:

- `priority`;
- ручной `order`;
- временные поля без поддержки schema.

## Проверка Kind

`rule` — короткая норма поведения.

`skill` — процедура выполнения задачи с trigger и workflow.

`reference` — справочный материал, пример, карта, подробная инструкция
или контекст.

## Проверка Load Mode

Практические соответствия:

- `rule`: `always`, `project` или `task`;
- `skill`: чаще `onDemand`;
- `reference`: `reference`.

Если `skill` или `reference` попадает в active context, это требует
отдельного обоснования и, вероятно, является ошибкой.

## Проверка Конфликтов

Сравни material с существующими items:

- тот же `scope`;
- та же `category`;
- пересекающиеся `appliesTo.projects`;
- пересекающиеся `appliesTo.technologies`;
- похожие verbs: "используй", "не используй", "предпочитай",
  "запрещено".

Если конфликт найден, не решай его порядком. Нужно переписать, сузить или
объединить materials.
