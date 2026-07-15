# План реализации MVP

Статус: planning-документ.

Этот документ фиксирует план, текущий прогресс и рабочие решения по MVP.
Финальную модель терминов и registry materials см. в
[Registry Materials](../../docs/concepts/registry-materials.md).

## 1. Цель MVP

Проверить, что команда может централизованно хранить AI-правила и
генерировать из них короткий, релевантный и проверяемый набор инструкций
для агента в локальном проекте.

Первая рабочая версия должна поддерживать сценарий:

``` text
Markdown registry с правилами
  -> Composer / Resolver
  -> Codex Adapter
  -> AGENTS.md
  -> .agents/generated/active-rules.md
  -> .agents/generated/rule-scope.md
  -> .agents/generated/rules/*.md
```

## 2. Что входит в MVP

-   файловый registry с Markdown-файлами и YAML frontmatter;
-   локальный конфиг проекта `.ai-skills.json`;
-   один агент: Codex;
-   генерация `AGENTS.md`;
-   генерация `.agents/generated/active-rules.md`;
-   генерация `.agents/generated/rule-scope.md`;
-   генерация category-файлов `.agents/generated/rules/*.md`;
-   manifest в generated-файлах;
-   детерминированный Composer / Resolver;
-   команды CLI:
    -   `ai-skills sync`;
    -   `ai-skills status`;
    -   `ai-skills check`;
    -   `ai-skills info <skill-id>`.

## 3. Что не входит в MVP

-   Web UI;
-   база данных;
-   backend API;
-   Cursor adapter;
-   Claude adapter;
-   автоматический watch-процесс;
-   фоновая синхронизация;
-   интеграция с YouTrack;
-   аналитика использования;
-   сложное автоматическое разрешение конфликтов.

## 4. Почему MVP можно проверить без базы данных

На первом этапе роль базы данных выполняет файловый registry. Наборы
правил выбираются из директории с Markdown-файлами и метаданными.

Пример структуры:

``` text
agent-sync-registry/
  skills/
    company/common.md
    frontend/angular.md
    frontend/code-review.md
    projects/statistics/api.md
  references/
  registry.generated.json
```

Минимальный публичный пример локального конфига:

``` json
{
  "project": "omega",
  "agents": ["codex"],
  "technologies": ["typescript", "angular", "nestjs"],
  "registry": "../agent-sync-registry"
}
```

Принятое решение для публичного конфига: `repository` и пользовательский
`output` не поддерживаются. `repository` оказался дублирующим слоем для
текущего сценария, а пути Codex output являются adapter defaults:
`AGENTS.md` и `.agents/generated/`.

CLI выполняет процесс:

1.  читает `.ai-skills.json`;
2.  открывает файловый registry;
3.  читает активные правила или `registry.generated.json`;
4.  фильтрует правила по проекту, агенту, технологиям, путям и типу задачи;
5.  сортирует правила по scope, severity, category и id;
6.  формирует resolved-набор;
7.  передает набор в Codex adapter;
8.  записывает generated-файлы в локальный проект.

База данных понадобится позже, когда появятся Web UI, права доступа,
workflow публикации, аудит действий, аналитика и server API. Для MVP она
не нужна, потому что главный проверяемый риск находится в Composer /
Resolver, а не в способе хранения данных.

## 5. Этапы реализации

Текущий статус:

``` text
[x] Этап 0. Фиксация границ MVP
[x] Этап 1. Структура registry и схемы
[x] Этап 2. Composer / Resolver
[x] Этап 3. Codex Adapter
[x] Этап 4. CLI
[~] Этап 5. Проверка на реальном проекте omega-1
```

Детальные документы по этапам:

-   [Этап 0. Границы MVP](./stage-0-mvp-boundaries.md)
-   [Этап 1. Registry и схемы](./stage-1-registry-and-schemas.md)
-   [Этап 2. Composer / Resolver](./stage-2-composer-resolver.md)
-   [Этап 3. Codex Adapter](./stage-3-codex-adapter.md)
-   [Этап 4. CLI](./stage-4-cli.md)
-   [Этап 5. Пилот на реальном проекте](./stage-5-real-project-pilot.md)
-   [Pilot Checklist](./pilot-checklist.md)

### Этап 0. Фиксация границ MVP

Статус: выполнено.

Результат:

-   согласован список поддерживаемых команд CLI;
-   согласован формат `.ai-skills.json`;
-   согласован формат frontmatter;
-   согласовано, что первый агент --- Codex;
-   согласовано, что generated-файлы не редактируются вручную.

Критерий готовности:

-   можно описать один тестовый проект и один registry так, чтобы
    Composer мог выбрать правила без дополнительных договоренностей.

### Этап 1. Структура registry и схемы

Статус: выполнено.

Результат:

``` text
registry/
  rules/
  skills/
  references/
  registry.generated.json

schemas/
  skill.schema.json
  project-config.schema.json
```

Необходимо реализовать:

-   формат Markdown + YAML frontmatter;
-   обязательные поля `id`, `kind`, `title`, `summary`, `scope`, `loadMode`,
    `status`, `category`, `severity`, `version`, `appliesTo`;
-   валидацию frontmatter;
-   несколько тестовых правил для проверки Composer-а;
-   генерацию или чтение `registry.generated.json`.

Критерий готовности:

-   CLI или библиотечная функция может прочитать registry и вернуть
    валидный список активных сущностей.

Фактически реализовано:

-   файловый registry в `registry/`;
-   схемы в `schemas/`;
-   чтение Markdown + YAML frontmatter;
-   валидация обязательных полей;
-   проверка duplicate skill id;
-   чтение `.ai-skills.json`.

### Этап 2. Composer / Resolver

Статус: выполнено.

Результат:

Библиотечный модуль, который принимает контекст проекта и возвращает
resolved-набор правил.

Вход:

``` ts
interface ResolveContext {
  project: string;
  agent: 'codex';
  technologies?: string[];
  taskType?: string;
  paths?: string[];
}
```

Выход:

``` ts
interface ResolveResult {
  included: ResolvedSkill[];
  skipped: SkippedSkill[];
  warnings: ComposerWarning[];
}
```

Необходимо реализовать:

-   фильтрацию по `status`;
-   фильтрацию по `appliesTo.projects`;
-   фильтрацию по `appliesTo.agents`;
-   фильтрацию по `appliesTo.taskTypes`;
-   базовую сортировку по scope, severity, category и id;
-   поддержку `loadMode`;
-   объяснение причины включения или исключения правила;
-   базовые предупреждения о deprecated, disabled или слишком больших
    правилах.

Критерий готовности:

-   одинаковый вход всегда дает одинаковый resolved-набор;
-   можно объяснить, почему конкретное правило попало или не попало в
    итоговый результат.

Фактически реализовано:

-   фильтрация по `status`, `agent`, `project`,
    `taskType`, `technologies`, `paths`;
-   разделение на `included`, `available`, `skipped`;
-   поддержка `loadMode`;
-   стабильная сортировка;
-   warnings;
-   estimated token metadata;
-   manifest с checksum;
-   `explainSkill`.

### Этап 3. Codex Adapter

Статус: выполнено.

Результат:

Генератор файлов для Codex:

``` text
AGENTS.md
.agents/generated/active-rules.md
.agents/generated/rule-scope.md
.agents/generated/skill-index.json
.agents/generated/rules/*.md
```

Необходимо реализовать:

-   короткий `AGENTS.md` со ссылкой на generated-файлы;
-   короткий bootstrap `active-rules.md`;
-   `rule-scope.md` с картой применимости;
-   category-файлы `rules/*.md` с подробными правилами;
-   `skill-index.json` со списком доступных и optional/on-demand правил;
-   manifest со списком включенных skill id, версий и checksum;
-   стабильную генерацию при повторном запуске.

Критерий готовности:

-   после `sync` Codex получает актуальный набор инструкций через
    `AGENTS.md`, а generated-файлы можно проверить вручную.

Фактически реализовано:

-   генерация русскоязычного `AGENTS.md`;
-   кликабельные ссылки на generated-файлы;
-   генерация короткого `.agents/generated/active-rules.md`;
-   генерация `.agents/generated/rule-scope.md`;
-   генерация `.agents/generated/rules/*.md`;
-   генерация `.agents/generated/skill-index.json`;
-   безопасная запись файлов без выхода за пределы project root.

### Этап 4. CLI

Статус: выполнено.

Результат:

Минимальный CLI, пригодный для проверки в локальном проекте.

Команды:

``` bash
ai-skills sync
ai-skills status
ai-skills check
ai-skills info <skill-id>
```

Необходимо реализовать:

-   чтение `.ai-skills.json`;
-   поиск registry;
-   запуск Composer / Resolver;
-   запуск Codex adapter;
-   вывод списка примененных правил;
-   вывод warnings;
-   проверку конфигурации через `check`;
-   объяснение выбора правила через `info`.

Критерий готовности:

-   разработчик может выполнить `ai-skills sync` в тестовом проекте и
    получить корректные generated-файлы.

Фактически реализовано:

-   `sync`;
-   `status`;
-   `check`;
-   `info`;
-   `--agent`;
-   `--task-type`;
-   `--project-root`;
-   `--technology`;
-   `--path`;
-   `--dry-run`;
-   smoke-тесты CLI.
-   `sync` автоматически создает `.agents/generated/` при первой
    генерации.

### Этап 5. Проверка на реальном проекте

Статус: в процессе. Пилотный проект: `W:\Работа\Projects\Omega\omega-1`.

Результат:

Пилотное применение MVP на одном frontend-репозитории.

Проверяем:

-   хватает ли метаданных для выбора правил;
-   не слишком ли большой `active-rules.md`;
-   понятно ли агенту, какие правила применять;
-   удобно ли разработчикам писать и обновлять правила;
-   не появляются ли дубли;
-   нужны ли task packs уже в первой версии;
-   какие команды CLI реально используются.

Критерий готовности:

-   один реальный проект может регулярно синхронизировать правила без
    ручного копирования инструкций.

Фактически сделано:

-   исходный `omega-1/AGENTS.md` изучен;
-   правила переведены и разложены по registry;
-   добавлены `project.omega.*` правила;
-   в `omega-1` создан `.ai-skills.json`;
-   `.ai-skills.json` упрощен: `repository` и пользовательский `output`
    удалены из формата, для Codex используются adapter defaults;
-   в `omega-1/.gitignore` добавлено `.agents/generated/`;
-   выполнены `check`, `sync`, `status`, `info`;
-   `omega-1/AGENTS.md` теперь generated entrypoint;
-   полный набор правил находится в
    `omega-1/.agents/generated/rules/*.md`;
-   добавлены `category` и `severity` для группировки правил;
-   добавлена карта применимости `omega-1/.agents/generated/rule-scope.md`;
-   добавлены команды проверки для `apps/front` и `apps/bff`.
-   по feedback пилота большой плоский `active-rules.md` заменен на
    bootstrap + `rule-scope.md` + category-файлы в
    `.agents/generated/rules/`.

Осталось проверить на реальной задаче:

-   добавить `AGENTS.md` в `.gitignore` проектов, если команда решит
    держать его локальным generated-файлом;
-   видит ли Codex generated `AGENTS.md`;
-   не перегружен ли active context;
-   корректно ли агент следует русскоязычным правилам;
-   какие правила стоит перевести в `task` или `reference`;
-   какие правила нужно добавить, убрать или разделить.

## 6. Расширение после MVP

После успешной проверки MVP можно добавлять:

-   research OpenSpec / open spec concept: уточнить стандарт, формат
    материалов, модель распространения и понять, стоит ли адаптировать
    AgentSync под него, если рабочие проекты начнут переходить на этот
    формат;
-   команду `ai-skills --version`;
-   упаковку AgentSync как npm-пакет;
-   основной сценарий установки пакета: глобально через
    `npm install -g @ai-tools/ai-skills`;
-   `devDependency` не использовать как основной rollout-сценарий;
-   Yandex Object Storage как удаленный registry скиллов;
-   provider abstraction для файлового и cloud registry;
-   локальный cache registry;
-   Cursor adapter;
-   Claude adapter;
-   task-specific packs;
-   on-demand/reference индекс;
-   lock-файл версий;
-   GitLab-hosted registry;
-   review workflow для company-level правил;
-   Web UI;
-   backend API;
-   фоновую синхронизацию;
-   интеграцию с WebStorm;
-   аналитику использования.

Зафиксированное post-MVP направление:
[npm-пакет и registry в Yandex Object Storage](./post-mvp-yandex-registry.md).

## 7. Главный критерий успеха

MVP считается успешным, если Composer / Resolver формирует для агента
короткий, релевантный, детерминированный и объяснимый набор инструкций,
который реально помогает в разработке и не перегружает контекст.
