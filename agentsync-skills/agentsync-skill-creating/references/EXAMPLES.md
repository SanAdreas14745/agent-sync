# Примеры Создания Скиллов

Этот reference показывает, как применять паттерн entrypoint +
`references/STRUCTURE.md` + `references/EXAMPLES.md`.

## Хороший Минимальный Каркас

``` text
task-writing/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

`material.md`:

``` markdown
---
id: agentsync.task-writing
kind: skill
title: Task Writing
summary: Помогает оформлять задачи в markdown. Использовать, когда нужно превратить сырой запрос в структурированную постановку задачи.
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

# Постановка Задач

## Назначение

Формировать понятные задачи для разработки, анализа и исправления багов.

## Workflow

1. Определить тип задачи.
2. Собрать недостающий контекст.
3. Сформировать описание и ожидаемый результат.
4. Проверить структуру по `references/STRUCTURE.md`.

Подробная структура: [references/STRUCTURE.md](references/STRUCTURE.md).
Примеры: [references/EXAMPLES.md](references/EXAMPLES.md).
```

Почему это хорошо:

- `material.md` задает процедуру;
- структура не раздувает основной файл;
- примеры доступны, но читаются только при необходимости.

## Плохой Вариант

``` markdown
# Постановка Задач

Ниже 200 строк структуры, затем 300 строк примеров, затем история того,
почему команда выбрала этот формат, затем TODO на будущую миграцию.
```

Проблемы:

- агент вынужден читать все сразу;
- временные заметки смешаны с рабочими инструкциями;
- структуру и примеры трудно переиспользовать;
- сложно понять, что является принятой практикой.

## Пример Разделения Ответственности

Для skill `agentsync-documentation`:

``` text
agentsync-documentation/
  SKILL.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

Здесь references оправданы, потому что политика размещения документации
имеет подробную структуру директорий, promotion workflow и примеры
классификации материалов.

`agentsync-documentation` является локальным Codex skill, поэтому его
entrypoint называется `SKILL.md`.

Для skill `agentsync-skill-creating`:

``` text
agentsync-skill-creating/
  SKILL.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

Здесь references оправданы, потому что нужны подробная схема и примеры
создания других скиллов.

В canonical registry тот же skill должен использовать `material.md`:

``` text
registry/skills/agentsync-skill-creating/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

## Пример Хорошего `description`

``` yaml
description: Локальный скилл AgentSync для создания и редактирования registry skills. Использовать, когда нужно написать новый skill, улучшить существующий skill, решить что оставить в локальном SKILL.md или registry material.md, что вынести в references/EXAMPLES.md или references/STRUCTURE.md, либо подготовить skill к переносу в registry.
```

Почему это хорошо:

- описывает действие;
- перечисляет trigger-ситуации;
- помогает агенту выбрать skill без чтения body.

## Пример Слабого `description`

``` yaml
description: Правила написания скиллов.
```

Почему это слабо:

- неясно, когда skill использовать;
- не указаны задачи редактирования, проверки и разделения references;
- агент может не активировать skill в близких сценариях.

## Типовые Ошибки

- Хранить все примеры прямо в entrypoint.
- Создавать `README.md` внутри skill-директории вместо использования entrypoint.
- Дублировать одну и ту же структуру в entrypoint и `STRUCTURE.md`.
- Оставлять в skill исследовательские заметки о том, почему его создавали.
- Создавать `scripts/` без конкретной повторяемой операции.
- Создавать references, но не ссылаться на них из entrypoint.
