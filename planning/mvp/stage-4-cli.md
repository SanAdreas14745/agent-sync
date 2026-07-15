# Этап 4. CLI

Статус: planning-документ.

Этот документ фиксирует рабочий план и критерии готовности этапа MVP.

## Цель

Собрать registry reader, Composer и Codex adapter в удобный инструмент,
который разработчик может запускать в локальном проекте.

## Команды MVP

``` bash
ai-skills sync
ai-skills status
ai-skills check
ai-skills info <skill-id>
```

## Общий поток

``` text
CLI
  -> читает .ai-skills.json
  -> читает registry
  -> запускает Composer
  -> запускает adapter
  -> показывает результат
```

## ai-skills sync

Назначение: применить актуальный набор правил к локальному проекту.

Минимальное поведение:

1.  найти `.ai-skills.json` в текущей директории;
2.  прочитать project config;
3.  открыть registry;
4.  прочитать и валидировать skills;
5.  запустить Composer;
6.  запустить Codex adapter;
7.  записать generated-файлы;
8.  вывести список включенных правил и warnings.

Пример вывода:

``` text
Resolved 4 active skills for codex:
- company.common@1
- frontend.common@2
- frontend.code-review@1
- project.statistics.api@1

Generated:
- AGENTS.md
- .agents/generated/active-rules.md
- .agents/generated/rule-scope.md
- .agents/generated/skill-index.json
- .agents/generated/rules/backend.md
- .agents/generated/rules/frontend.md

Warnings: 0
```

Опции, которые полезны уже в MVP:

``` bash
ai-skills sync --agent codex
ai-skills sync --task-type code-review
ai-skills sync --dry-run
```

`--dry-run` не записывает файлы, а показывает, что было бы сгенерировано.

## ai-skills status

Назначение: показать текущее состояние синхронизации.

Минимальное поведение:

-   прочитать `.ai-skills.json`;
-   прочитать generated manifest, если он есть;
-   показать agent и project;
-   показать включенные skill id и версии;
-   показать warnings из последнего sync;
-   показать, существуют ли ожидаемые generated-файлы.

Пример:

``` text
Project: statistics
Agent: codex

Generated files:
- AGENTS.md: exists
- .agents/generated/active-rules.md: exists
- .agents/generated/skill-index.json: exists

Included skills:
- company.common@1
- frontend.common@2
- project.statistics@1
```

## ai-skills check

Назначение: найти проблемы конфигурации и registry.

Проверки MVP:

-   `.ai-skills.json` существует;
-   project config валиден;
-   registry path существует;
-   registry читается;
-   нет duplicate skill id;
-   все required поля заполнены;
-   нет invalid `scope`;
-   нет invalid `loadMode`;
-   нет invalid `status`;
-   output paths не выходят за пределы проекта;
-   active rules не пустые.

Пример:

``` text
Check results:
OK  project config found
OK  registry found
OK  12 skills loaded
OK  no duplicate ids
WARN active context estimated size is 9200 tokens, budget is 8000
```

## ai-skills info

Назначение: объяснить, почему конкретный skill включен или исключен.

Пример:

``` bash
ai-skills info frontend.code-review --task-type code-review
```

Пример вывода:

``` text
frontend.code-review
Status: included

Reasons:
- status active
- agent codex matches
- project statistics matches
- taskType code-review matches
- loadMode task is active for current task type
```

Если skill исключен:

``` text
frontend.code-review
Status: skipped

Reasons:
- status active
- agent codex matches
- project statistics matches
- taskType code-review does not match current taskType refactoring
```

## Ошибки

CLI должен завершаться с ненулевым exit code, если:

-   не найден `.ai-skills.json`;
-   project config невалиден;
-   registry path не найден;
-   skill frontmatter невалиден;
-   output path небезопасен;
-   adapter не смог записать файл.

Warnings не должны ломать `sync`, если результат можно корректно
сгенерировать.

## Конфигурация

MVP не требует глобального конфига пользователя. Все нужное должно быть в
локальном `.ai-skills.json`.

Глобальный конфиг можно добавить позже для:

-   default registry path;
-   user/team identity;
-   credentials;
-   telemetry settings;
-   IDE integration.

## Тесты

Минимальные тесты:

-   `sync` создает expected files;
-   `sync --dry-run` не пишет файлы;
-   `status` читает generated manifest;
-   `check` находит отсутствующий registry;
-   `check` находит duplicate skill id;
-   `info` объясняет included skill;
-   `info` объясняет skipped skill;
-   CLI возвращает ненулевой exit code при invalid config.

## Критерии готовности

-   CLI можно запустить в sample project;
-   `sync` генерирует Codex-файлы;
-   `status` показывает состояние;
-   `check` помогает диагностировать ошибки;
-   `info` объясняет выбор Composer-а;
-   команды работают без backend API и БД.

## Выход этапа

Первый end-to-end MVP, который можно запускать руками в локальном
проекте.
