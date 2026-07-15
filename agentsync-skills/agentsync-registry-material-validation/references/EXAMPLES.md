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

Хорошо:

``` yaml
kind: skill
loadMode: onDemand
summary: Использовать, когда пользователь просит сделать review.
```

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

## Project-Specific Правило В Team Scope

Плохо:

``` yaml
id: frontend.git-naming
scope: team
```

Body требует ветки формата `om-1855-feature-...`.

Почему плохо:

- `OM-*` является проектным соглашением;
- material должен быть `scope: project` и `appliesTo.projects: ["omega"]`.

## Reference В Active Context

Плохо:

``` yaml
kind: reference
loadMode: project
```

Почему плохо:

- длинный справочник попадет в active context;
- reference должен использовать `loadMode: reference`.

## Конфликт Без Priority

Плохо:

- company rule: "Предпочитай constructor injection".
- team Angular rule: "Предпочитай `inject()`".

Что делать:

- не добавлять numeric order;
- сузить первое правило до BFF/NestJS;
- либо переписать оба rules так, чтобы они явно описывали разные
  технологии.
