# Примеры Валидации Registry Materials

## Rule Вместо Skill

Плохо:

``` yaml
kind: rule
title: Frontend Code Review Rules
```

Body описывает процесс review: найти diff, отсортировать findings,
оформить результат.

Почему плохо:

- это workflow, а не короткая норма;
- review-режим вреден для обычной реализации;
- material должен быть `kind: skill`, `loadMode: onDemand`.

## Слишком Широкое Правило

Плохо:

``` yaml
scope: company
category: frontend
appliesTo:
  agents: ["codex"]
```

Body содержит Angular-specific требования.

Почему плохо:

- правило применится к не-Angular проектам;
- нужно добавить `technologies: ["angular"]` или опустить scope до
  project, если правило локальное.

## Reference В Active Context

Плохо:

``` yaml
kind: reference
loadMode: project
```

Почему плохо:

- длинный справочник попадет в active context;
- reference должен использовать `loadMode: reference`.
