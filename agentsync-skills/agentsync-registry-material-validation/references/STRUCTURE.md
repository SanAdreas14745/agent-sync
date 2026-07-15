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
- временные поля без поддержки schema;
- пустой `appliesTo`, если material явно относится только к части проектов,
  технологий или агентов.

## Проверка Kind

`rule`:

- короткая норма поведения;
- отвечает на вопрос "что соблюдать?";
- не содержит полноценный workflow;
- может попадать в active rules.

`skill`:

- процедура выполнения задачи;
- отвечает на вопрос "как выполнить процесс?";
- имеет trigger в `summary`;
- body содержит workflow;
- при необходимости использует `references/`, `scripts/`, `evals`, `assets`.

`reference`:

- справочный материал, пример, карта, подробная инструкция или контекст;
- не должен автоматически попадать в active context;
- доступен через `skill-index.json` или ссылку из skill.

## Проверка Load Mode

Практические соответствия:

- `rule`: `always`, `project` или `task`;
- `skill`: чаще `onDemand`;
- `reference`: `reference`.

Если `skill` или `reference` попадает в active context, это требует
отдельного обоснования и, вероятно, является ошибкой.

## Проверка Scope

`company`:

- правило действительно применимо ко всем поддерживаемым проектам;
- нет проектных имен, путей или технологий без `appliesTo`.

`team`:

- правило принадлежит зоне ответственности команды;
- должно быть ограничено технологиями, если относится к Angular, BFF,
  TypeScript и т.д.

`project`:

- материал содержит project-specific naming, команды, пути, доменный
  контекст или workflow.

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

## Проверка Directory-Based Skill

Для `registry/skills/<name>/material.md`:

- directory name соответствует id или краткому stable alias;
- `material.md` содержит trigger, назначение, workflow и чек-лист;
- подробности вынесены в `references/`;
- links из `material.md` ведут на важные resources;
- bundled `references/` не парсятся как отдельные registry materials.
