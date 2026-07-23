# План реализации post-MVP

Статус: roadmap. Документ фиксирует принятое направление дальнейшего развития
после локально проверенного MVP.

## Цель

Отделить жизненный цикл canonical registry от жизненного цикла npm-пакета
AgentSync. CLI остаётся устанавливаемым инструментом, а rules, skills и
references хранятся и изменяются в отдельном Git-репозитории.

Проекты-потребители используют один зафиксированный commit registry. Обычный
`ai-skills sync` воспроизводит уже выбранную версию, а `ai-skills update`
осознанно переводит проект на новый commit выбранной ветки или tag.

## Текущий baseline

Реализовано:

- файловый и bundled registry;
- `RegistryProvider`, `FileRegistryProvider`, Composer и agent adapters;
- `sync`, `check`, `status`, `info` и `registry review`;
- release-layout и локальный cache как повторно используемая основа для
  immutable snapshots;
- адаптеры Codex, Claude Code, Cursor и GitHub Copilot.

Git registry с lock-файлом и immutable cache; команды `sync` и `update`.
Bundled registry удалён в версии 2.0.0. Файловый registry остаётся baseline
для локальной разработки и тестов.

## Принятая целевая модель

```text
отдельный Git-репозиторий registry
  └─ branch/tag → commit SHA
                    ↓
проект-потребитель
  .ai-skills.json  (url + ref)
  .ai-skills.lock.json (resolvedCommit)
                    ↓
локальный immutable cache
                    ↓
ai-skills sync → generated instructions
```

Пример конфигурации:

```json
{
  "registry": {
    "type": "git",
    "url": "https://github.com/company/agent-sync-registry",
    "ref": "main"
  }
}
```

Lock-файл хранит `source`, `requestedRef` и полный `resolvedCommit`. Он должен
коммититься в проекте-потребителе.

## Ближайшие этапы

### 1. Контракт Git registry и lock-файла — выполнен

- Добавить `type: "git"`, обязательные `url` и `ref` в `.ai-skills.json`.
- Ввести схему `.ai-skills.lock.json` и её валидацию.
- Зафиксировать material root отдельного Git-репозитория и нормализацию URL.
- Сохранить file и bundled config без breaking changes.

### 2. Git provider и immutable cache — выполнен

- Реализовать `GitRegistryProvider`.
- Получать snapshot строго по полному commit SHA.
- Кэшировать snapshot по нормализованному source и commit SHA.
- Проверять, что полученный commit совпадает с lock-файлом, до чтения
  materials.
- Определить безопасное поведение offline cache miss: завершать с ошибкой, не
  подменяя pinned версию другой.

### 3. Команды `sync` и `update` — выполнен

- `sync` читает только commit из lock-файла; при cache hit не использует сеть.
- `update` разрешает настроенный `ref`, загружает новый snapshot, запускает
  существующую валидацию и только после успеха атомарно обновляет lock-файл.
- После успешного update запускается та же генерация, что у `sync`.
- `check` и `status` показывают source, ref, resolved commit и состояние кэша.

### 4. Тестирование и миграционный пилот — выполнен

- Добавлены проверки cache hit/miss, отсутствующего lock, несовпадения SHA,
  невалидного registry и атомарности lock update.
- Создан отдельный Git-репозиторий canonical registry, в который перенесены
  текущие materials.
- Пилот на BrandApp подтвердил: `update` фиксирует commit, а повторный `sync`
  воспроизводит generated output.
- `registry/` исключён из npm-пакета, bundled provider удалён в версии 2.0.0.

## Принципы и ограничения

- Git — единственный планируемый удалённый источник registry; платные object
  storage и отдельный backend не входят в roadmap.
- Registry редактируется через обычный Git workflow: branch, pull request,
  review и merge.
- Credentials не хранятся в `.ai-skills.json` или lock-файле.
- Переход на новую версию registry всегда явный через `ai-skills update`.
- Невалидный или недоступный snapshot не меняет lock-файл и generated output.
- Web UI, write API, фоновая синхронизация и аналитика остаются вне ближайшего
  цикла.

## Критерий готовности направления

Два потребителя с одинаковыми `.ai-skills.json` и `.ai-skills.lock.json`
получают идентичные материалы и generated instructions независимо от того,
насколько далеко сдвинулась отслеживаемая ветка registry.
