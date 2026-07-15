# Структура Скилла AgentSync

Этот reference описывает рекомендуемую структуру registry skills AgentSync.
Он дополняет `material.md` и нужен, когда создается новый скилл или
перерабатывается существующий.

## Директория Скилла

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

Добавляй `scripts/`, `evals` и `assets/` только при реальной
необходимости. Не создавай пустые директории "на будущее".

## `material.md`

`material.md` — canonical registry entrypoint. Он должен быть коротким и процедурным.

Обязательные части:

- registry frontmatter;
- заголовок;
- назначение;
- главный принцип;
- базовый workflow;
- ссылки на reference-файлы;
- короткий чек-лист.

Frontmatter registry skill:

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

## References

`references/STRUCTURE.md` содержит подробную структуру результата или
процесса.

`references/EXAMPLES.md` содержит хорошие и плохие примеры, короткие
образцы frontmatter и типовые ошибки.

Не дублируй в `material.md` всю структуру из references. В основном файле
оставь только ссылку и краткое назначение reference-файла.
