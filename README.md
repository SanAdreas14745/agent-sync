# AgentSync

AgentSync — инструмент для централизованного управления AI-скиллами и
правилами разработки.

Разработчик запускает CLI в проекте, а AgentSync выбирает правила из
централизованного registry и генерирует инструкции в формат конкретного
AI-агента.

AgentSync распространяется как внутренний npm-пакет через GitHub Packages.
Пакет содержит CLI и adapters, а canonical registry рекомендуется хранить в
отдельном Git-репозитории. До завершения migration-пилота пакет также содержит
bundled registry как совместимый fallback. Версия Git registry фиксируется в
проекте-потребителе, поэтому обновление rules/skills не требует выпуска новой
версии CLI.

## Требования

- Node.js 20 или новее;
- доступ на чтение пакетов namespace `@harness-system` в GitHub Packages;
- classic personal access token GitHub с разрешением `read:packages` для
  установки внутреннего пакета.

## Быстрый старт

### 1. Настроить GitHub Packages и установить CLI

Добавьте строки из [.npmrc.example](./.npmrc.example) в пользовательский
`C:\Users\<user>\.npmrc`. Файл направляет только scope `@harness-system` в
GitHub Packages и берёт токен из переменной окружения, поэтому токен не должен
попадать в Git:

``` Powershell
$env:NODE_AUTH_TOKEN = '<GitHub PAT с read:packages>'
npm.cmd install -g @harness-system/pb-agent-sync
```

Проверить установленную версию:

``` Powershell
ai-skills --version
```

### 2. Добавить `.ai-skills.json`

В корне целевого проекта нужен файл `.ai-skills.json`:

``` json
{
  "project": "omega",
  "agents": ["codex", "claude-code", "cursor", "github-copilot"],
  "technologies": ["typescript", "angular", "nestjs"],
  "registry": {
    "type": "git",
    "url": "https://github.com/company/agent-sync-registry",
    "ref": "main"
  }
}
```

Отдельный Git-репозиторий должен содержать materials в каталоге `registry/`.
Первое получение версии выполняется явной командой:

``` shell
ai-skills update --project-root .
```

Она создаёт `.ai-skills.lock.json` с полным commit SHA. Команда `sync` затем
читает только зафиксированный commit и при наличии локального кэша не обращается
к сети.

`"type": "bundled"` остаётся совместимым способом: он читает registry,
вложенный в установленный npm-пакет. Файловый путь поддерживается для локального
пилота или отдельного набора материалов:

``` json
{
  "registry": "../../AgentSync/registry"
}
```

Поддерживаемые идентификаторы: `codex`, `claude-code`, `cursor` и
`github-copilot`. По умолчанию используется первый из `agents`; другой
adapter можно выбрать через `--agent`.

### 3. Обновить registry и запустить генерацию

``` shell
ai-skills update --project-root .
ai-skills sync --project-root .
ai-skills sync --project-root . --agent cursor
```

Если CLI еще не установлен как npm-пакет и запускается из локальной копии
AgentSync:

``` shell
node ../../AgentSync/dist/cli.js sync --project-root .
```

### 4. Проверить результат

Для Codex после `sync` в корне проекта появятся:

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

Другие adapter-ы используют нативные каталоги автодискавери: среда агента
сама обнаруживает rules и skills в этих расположениях. Ссылки из
пользовательских `CLAUDE.md` или `.github/copilot-instructions.md` для
этого не нужны, поэтому AgentSync их не перезаписывает:

| Агент | Rules | Skills |
| --- | --- | --- |
| Claude Code | `.claude/rules/agentsync/` | `.claude/skills/agentsync-<name>/SKILL.md` |
| Cursor | `.cursor/rules/agentsync-*.mdc` | `.cursor/skills/agentsync-<name>/SKILL.md` |
| GitHub Copilot | `.github/instructions/agentsync-*.instructions.md` | `.github/skills/agentsync-<name>/SKILL.md` |

## Команды

### `ai-skills sync`

Для Git registry собирает правила из commit, зафиксированного в
`.ai-skills.lock.json`, и генерирует файлы для выбранного агента. Команда не
переводит проект на новую версию отслеживаемой ветки; для этого используй
`update`.

``` shell
ai-skills sync --project-root .
```

Для предварительного просмотра без записи файлов:

``` shell
ai-skills sync --project-root . --dry-run
```

### `ai-skills update`

Разрешает текущий `ref` Git registry, загружает и валидирует его snapshot,
атомарно обновляет `.ai-skills.lock.json`, затем запускает генерацию файлов.

``` shell
ai-skills update --project-root .
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

### `ai-skills registry review`

Проверяет качество materials в registry, указанном в `.ai-skills.json`, без
генерации файлов и без изменения самого registry.

``` shell
ai-skills registry review --project-root .
```

Команда находит ошибки структуры и качества: material в неправильной
директории, reference в active context, конфликтующие правила в
пересекающемся контексте и отсутствующие bundled resources. Она также
показывает warnings для слишком широкого `appliesTo`, дублирующегося текста
и rules, которые больше похожи на workflow.

Exit code будет ненулевым при ошибках; warnings не блокируют review. Это
детерминированный lint, который дополняет, но не заменяет агентный review
содержания.

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
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["typescript"]
---

## Правила

- Не используй `any`; используй конкретный type или `unknown`.
```

## Поставка registry

Основной способ доставки — отдельный Git-репозиторий с canonical `registry/`.
В `.ai-skills.json` хранится URL и отслеживаемый `ref`, а
`.ai-skills.lock.json` фиксирует полный resolved commit. `ai-skills update`
явно обновляет этот commit; `ai-skills sync` воспроизводит зафиксированную
версию из локального кэша или получает ровно этот commit из Git.

`bundled` и файловый registry остаются доступными для обратной совместимости,
локальной разработки и тестов.

## Публикация внутреннего пакета

Workflow [.github/workflows/publish-package.yml](./.github/workflows/publish-package.yml)
публикует пакет после создания GitHub Release с тегом `v<версия package.json>`.
Перед первым релизом maintainer добавляет в repository Actions secret
`GH_PACKAGES_TOKEN`: classic GitHub PAT с `write:packages` для namespace
`@harness-system`. Он нужен, пока владелец исходного репозитория и namespace
пакета различаются; секрет в код и `.npmrc` не добавляется.

Перед созданием Release:

``` Powershell
npm.cmd run verify
```

Workflow проверяет совпадение тега с версией, собирает проект, запускает тесты,
проверяет состав npm-архива и только затем выполняет `npm publish` в
`https://npm.pkg.github.com`.

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

Проверить publish-архив без публикации:

``` shell
npm.cmd run verify
```

Ожидаемый результат:

``` text
composer tests passed
codex adapter tests passed
agent adapter tests passed
package distribution tests passed
cli tests passed
```

### Smoke-проверка глобального CLI

После локальной сборки можно проверить пакет так же, как его будет
устанавливать разработчик:

``` Powershell
npm.cmd install -g .
ai-skills --version
ai-skills check --project-root <путь-до-тестового-проекта>
ai-skills update --project-root <путь-до-тестового-проекта>
ai-skills sync --project-root <путь-до-тестового-проекта>
ai-skills status --project-root <путь-до-тестового-проекта>
```

Команды `check`, `sync` и `status` должны завершиться без ошибок, а `sync`
должна создать локальные generated-файлы в тестовом проекте.

Локально проверить внешний проект:

``` shell
node ./dist/cli.js check --project-root <путь до локальной директории проекта>
node ./dist/cli.js update --project-root <путь до локальной директории проекта>
node ./dist/cli.js sync --project-root <путь до локальной директории проекта>
node ./dist/cli.js status --project-root <путь до локальной директории проекта>
```
