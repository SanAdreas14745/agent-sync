# AgentSync

AgentSync — инструмент для централизованного управления AI-скиллами и
правилами разработки.

Разработчик запускает CLI в проекте, а AgentSync выбирает правила из
централизованного registry и генерирует инструкции в формат конкретного
AI-агента.

Текущий MVP читает файловый registry. Целевая модель после пилота —
npm-пакет с remote registry.

## Быстрый старт

### 1. Установить CLI

Основной сценарий для разработчиков — глобальная установка npm-пакета:

``` Powershell
npm install -g @ai-tools/ai-skills
```

Для доступа к внутреннему npm registry нужен `.npmrc`. Пример лежит в
[.npmrc.example](./.npmrc.example): в нем указан scope `@ai-tools` и
заглушка вместо токена.

Путь для расположения файла:
``` text
C:\Users\<user>\.npmrc
```

### 2. Добавить `.ai-skills.json`

В корне целевого проекта нужен файл `.ai-skills.json`:

``` json
{
  "project": "omega",
  "agents": ["codex"],
  "technologies": ["typescript", "angular", "nestjs"],
  "registry": "../../AgentSync/registry"
}
```

Пока MVP работает с файловым registry, поэтому `registry` указывает путь
до директории с правилами. После перехода на remote registry это значение
заменится на опубликованный registry-адрес или alias; локальный путь
`../../AgentSync/registry` нужен только для текущей пилотной проверки.

### 3. Запустить генерацию

``` shell
ai-skills sync --project-root .
```

Если CLI еще не установлен как npm-пакет и запускается из локальной копии
AgentSync:

``` shell
node ../../AgentSync/dist/cli.js sync --project-root .
```

### 4. Проверить результат

После `sync` в корне проекта появятся:

``` text
<target-project>/
  AGENTS.md
  .agents/
    generated/
      active-rules.md
      rule-scope.md
      skill-index.json
      rules/
        required.md
        frontend.md
        bff.md
        ...
```

`AGENTS.md` — короткий entrypoint для Codex. Подробные правила лежат в
`.agents/generated/`.

## Команды

### `ai-skills sync`

Собирает актуальные правила для текущего проекта и генерирует файлы для
выбранного агента.

``` shell
ai-skills sync --project-root .
```

Для предварительного просмотра без записи файлов:

``` shell
ai-skills sync --project-root . --dry-run
```

### `ai-skills info <material-id>`

Показывает информацию о конкретном registry material в контексте текущего проекта:
его статус и причины, по которым он был включен, доступен только через
индекс или пропущен.

Команда полезна, когда непонятно, почему правило попало или не попало в
итоговый набор.

Возможные статусы:

- `included` — правило попало в active rules;
- `available` — material подходит проекту, но доступен только через
  `skill-index.json`, например `reference` или `onDemand`;
- `skipped` — material был найден, но не подходит текущему контексту;
- `unknown` — такого material id нет в resolved-наборе.

Пример:

``` shell
ai-skills info frontend.typescript --project-root .
```

Пример объяснения:

``` text
frontend.typescript
Status: included

Reasons:
- status active
- agent codex matches appliesTo.agents
- project has no restriction
- taskType has no restriction
- technology typescript matches restriction
- path has no restriction
- loadMode project is included in active context
```

### `ai-skills status`

Показывает текущее состояние generated-файлов в проекте.

``` shell
ai-skills status --project-root .
```

### `ai-skills check`

Диагностирует, готов ли проект к синхронизации.

Проверяет, что `.ai-skills.json` валиден, registry найден, skill-файлы
читаются, output paths безопасны, а Composer может собрать active-набор
правил.

``` shell
ai-skills check --project-root .
```

## Registry

Registry содержит Markdown-файлы с YAML frontmatter.

Модель registry materials описана отдельно:
[Registry Materials](./docs/concepts/registry-materials.md).
Коротко: `rule` задает норму поведения, `skill` описывает процедуру
выполнения задачи, `reference` хранит длинный справочный контекст.

Пример структуры:

``` text
registry/
  rules/
    company/
    frontend/
    projects/
  skills/
    <skill-name>/
      material.md
      references/
  references/
```

`rules/` содержит короткие нормы поведения, которые Composer может включить
в active-набор.

`skills/` содержит directory-based процедуры выполнения задач. Обязателен
только `material.md`; подробные примеры и справочники выносятся в
`references/` внутри директории скилла.

`references/` предназначена для справочных материалов: архитектурных
обзоров, описаний домена, карт модулей, интеграционных схем, глоссариев и
других документов, которые полезны агенту для ознакомления, но слишком
широкие или длинные для постоянной загрузки в active context. Такие
материалы должны использовать `loadMode: reference`: они попадают в
`skill-index.json`, но не в `active-rules.md`.

Пример правила:

``` md
---
id: frontend.typescript
kind: rule
title: Frontend TypeScript Rules
summary: TypeScript-правила frontend-команды.
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
  technologies: ["typescript"]
---

## Правила

- Не используй `any`; используй конкретный type или `unknown`.
```

## Локальная разработка AgentSync

Этот раздел нужен тем, кто работает с исходниками AgentSync.

Установить зависимости:

``` shell
npm.cmd install
```

Собрать локальный CLI:

``` shell
npm.cmd run build
```

Запустить тесты:

``` shell
npm.cmd test
```

Ожидаемый результат:

``` text
composer tests passed
codex adapter tests passed
cli tests passed
```

Локально проверить внешний проект:

``` shell
node ./dist/cli.js check --project-root <путь до локальной директории проекта>
node ./dist/cli.js sync --project-root <путь до локальной директории проекта>
node ./dist/cli.js status --project-root <путь до локальной директории проекта>
```
