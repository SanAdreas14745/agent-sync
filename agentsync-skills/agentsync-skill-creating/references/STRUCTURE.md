# Структура Скилла AgentSync

Этот reference описывает рекомендуемую структуру скиллов AgentSync.
Он дополняет локальный `SKILL.md` и нужен, когда создается новый скилл или
перерабатывается существующий.

## Цели Структуры

Скилл должен:

- быстро объяснять агенту, когда и зачем его использовать;
- не перегружать основной entrypoint деталями;
- хранить подробную структуру и примеры рядом, но не в основном workflow;
- быть пригодным для будущего переноса из `planning/skills/` в canonical registry.

## Директория Registry Skill

Минимальная структура:

``` text
skill-name/
  material.md
```

Рекомендуемая структура для нетривиального скилла:

``` text
skill-name/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

Расширенная структура:

``` text
skill-name/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
    <domain-or-mode>.md
  scripts/
    <repeatable-operation>.<ext>
  evals/
    evals.json
  assets/
    <templates-or-static-assets>
```

Добавляй `scripts/`, `evals/` и `assets/` только при реальной
необходимости. Не создавай пустые директории "на будущее".

`material.md` используется только в canonical registry. Не называй registry
entrypoint `SKILL.md`, иначе IDE/Codex validators будут проверять его как
agent-specific skill и ругаться на поля `id`, `kind`, `title`, `summary`.

## Локальный Codex Skill

Для локальных скиллов в `agentsync-skills/` структура остается такой:

``` text
skill-name/
  SKILL.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

`SKILL.md` используется для agent-specific Codex skills и должен иметь
frontmatter `name` + `description`.

## Entrypoint

`material.md` или `SKILL.md` — entrypoint. Он должен быть коротким и
процедурным.

Обязательные части:

- YAML frontmatter;
- заголовок;
- назначение;
- главный принцип;
- базовый workflow;
- ссылки на reference-файлы;
- короткий чек-лист.

Frontmatter локального Codex skill (`SKILL.md`):

``` yaml
---
name: skill-name
description: Что делает skill и когда его использовать.
---
```

В `description` нужно включить trigger-контексты, потому что именно это
поле помогает агенту понять, когда использовать skill.

Frontmatter registry skill (`material.md`):

``` yaml
---
id: agentsync.skill-creating
kind: skill
title: AgentSync Skill Creating
summary: Что делает skill и когда его использовать.
scope: project
loadMode: onDemand
status: active
category: general
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["agentsync"]
  agents: ["codex"]
---
```

В registry frontmatter не используй `priority` или ручной `order`.

## `references/STRUCTURE.md`

`STRUCTURE.md` содержит подробную структуру результата или процесса.

Используй его для:

- описания разделов итогового документа;
- требований к обязательности разделов;
- критериев качества;
- правил именования;
- схем директорий;
- таблиц принятия решений.

Не дублируй в entrypoint всю структуру из `STRUCTURE.md`. В основном файле
оставь только ссылку и краткое назначение reference-файла.

## `references/EXAMPLES.md`

`EXAMPLES.md` содержит примеры.

Используй его для:

- хороших и плохих вариантов;
- коротких образцов frontmatter;
- примеров разделения entrypoint и references;
- типовых ошибок;
- мини-кейсов.

Примеры должны быть достаточно короткими, чтобы их можно было быстро
прочитать, и достаточно конкретными, чтобы по ним можно было повторить
паттерн.

## Когда Делить References

Дели reference-файлы, если:

- один файл стал длинным и смешивает несколько тем;
- появились разные режимы работы skill;
- появились разные домены или технологии;
- агенту обычно нужна только часть справочного материала.

Пример:

``` text
api-versioning/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
    fastapi.md
    openapi-portal.md
```

## Чек-Лист Качества

- Entrypoint можно прочитать быстро.
- В entrypoint есть понятный workflow.
- Примеры вынесены в `references/EXAMPLES.md`.
- Подробная структура вынесена в `references/STRUCTURE.md`.
- Нет дублирования одного и того же правила в нескольких файлах.
- Ссылки из entrypoint ведут на все важные reference-файлы.
- В skill нет временных исследовательских заметок, если они не являются частью его назначения.
