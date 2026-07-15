# Этап 1. Registry и схемы

Статус: planning-документ.

Этот документ фиксирует рабочий план и критерии готовности этапа MVP.

## Цель

Спроектировать файловый registry и форматы данных так, чтобы Composer мог
детерминированно читать, валидировать и фильтровать правила без базы
данных.

## Результат этапа

Рабочая структура registry с тестовыми правилами и схемами:

``` text
registry/
  skills/
    company/
    frontend/
    projects/
  references/
  registry.generated.json

schemas/
  skill.schema.json
  project-config.schema.json
```

## Файловый формат

Каждый скилл хранится как Markdown-файл с YAML frontmatter:

``` md
---
id: frontend.code-review
title: Code Review Rules
summary: Rules for reviewing frontend changes
scope: team
loadMode: task
status: active
version: 1
owner: frontend
updatedAt: 2026-07-07
appliesTo:
  projects: ["statistics"]
  agents: ["codex"]
  taskTypes: ["code-review"]
---

## Rules

- Check public API changes.
- Check tests for changed behavior.
```

## Обязательные поля

``` text
id
title
summary
scope
loadMode
status
version
owner
updatedAt
appliesTo
body
```

## Рекомендуемые значения

### scope

``` text
company
team
project
directory
taskType
```

### loadMode

``` text
always
project
task
onDemand
reference
```

### status

``` text
draft
active
deprecated
disabled
```

## Семантика loadMode

`always`:
Правило почти всегда попадает в активный контекст, если подходит по
agent/project. Использовать редко.

`project`:
Правило включается для конкретного проекта.

`task`:
Правило включается только при совпадении `taskType`.

`onDemand`:
Правило не включается в активный контекст, но попадает в индекс доступных
материалов.

`reference`:
Длинный справочный материал. В активный контекст не попадает. Должен быть
доступен по ссылке или через индекс.

К `reference` относятся архитектурные обзоры, описания домена, карты
модулей, интеграционные схемы, глоссарии и другие материалы для
ознакомления агента. Это не active rules: агент открывает их только когда
они нужны для конкретной задачи.

## appliesTo

Поле `appliesTo` определяет область применения:

``` yaml
appliesTo:
  projects: ["statistics"]
  agents: ["codex"]
  taskTypes: ["code-review"]
  paths: ["src/app/**/*.ts"]
  technologies: ["angular"]
```

Пустой массив означает, что ограничение не задано. Отсутствующее поле
также означает отсутствие ограничения.

## Индекс registry.generated.json

Для MVP можно читать Markdown-файлы напрямую. Но полезно сразу
предусмотреть generated-индекс:

``` json
{
  "version": 1,
  "generatedAt": "2026-07-07T00:00:00.000Z",
  "skills": [
    {
      "id": "frontend.code-review",
      "file": "skills/frontend/code-review.md",
      "title": "Code Review Rules",
      "summary": "Rules for reviewing frontend changes",
      "scope": "team",
      "loadMode": "task",
      "status": "active",
      "version": 1,
      "appliesTo": {
        "projects": ["statistics"],
        "agents": ["codex"],
        "taskTypes": ["code-review"]
      }
    }
  ]
}
```

На первом шаге индекс может генерироваться командой или создаваться
внутри тестовых фикстур. Важно, чтобы Composer был спроектирован так,
чтобы ему было безразлично, пришли данные из Markdown или из индекса.

## Формат .ai-skills.json

Минимальный формат локального проекта:

``` json
{
  "project": "statistics",
  "agents": ["codex"],
  "technologies": ["typescript"],
  "registry": "../agent-sync-registry"
}
```

Codex adapter по умолчанию пишет `AGENTS.md` и `.agents/generated/`.
Пользовательский `output` в MVP не поддерживается.

Дополнительные поля можно добавить позже:

``` json
{
  "defaultTaskType": "feature"
}
```

## Валидация

Нужно проверять:

-   уникальность `id`;
-   корректность `scope`;
-   корректность `loadMode`;
-   корректность `status`;
-   что `version` является положительным числом;
-   что `updatedAt` имеет валидный формат даты;
-   что body не пустой для `rule` и `skill`;
-   что deprecated/disabled правила не включаются в active-набор.

## Тестовые данные

Минимальный набор для проверки:

``` text
company.common
frontend.common
frontend.code-review
project.statistics
```

Нужно покрыть случаи:

-   правило подходит всем проектам;
-   правило подходит только одному проекту;
-   правило подходит только одному taskType;
-   правило не подходит текущему агенту;
-   deprecated правило не включается;
-   reference не попадает в active context.

## Критерии готовности

-   есть структура registry;
-   есть схема скилла;
-   есть схема `.ai-skills.json`;
-   есть тестовые Markdown-файлы;
-   registry можно прочитать программно;
-   ошибки в frontmatter обнаруживаются до генерации файлов;
-   данные передаются Composer-у в нормализованном виде.

## Выход этапа

Нормализованный список сущностей registry, пригодный для Resolver-а.
