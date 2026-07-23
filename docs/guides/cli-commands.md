# Команды CLI

Команды выполняются из корня проекта-потребителя. Параметр
`--project-root` позволяет явно указать этот каталог.

## `ai-skills sync`

Собирает правила из commit, зафиксированного в `.ai-skills.lock.json`, и
генерирует файлы для выбранного AI-агента. Команда не переводит проект на
новую версию registry.

```shell
ai-skills sync --project-root .
```

Для предварительного просмотра без записи файлов:

```shell
ai-skills sync --project-root . --dry-run
```

## `ai-skills update`

Разрешает текущий `ref` Git registry, загружает и валидирует snapshot,
атомарно обновляет `.ai-skills.lock.json`, затем запускает генерацию файлов.

```shell
ai-skills update --project-root .
```

## `ai-skills info <material-id>`

Показывает статус конкретного материала и причины, по которым он включён,
доступен только через индекс или пропущен.

```shell
ai-skills info frontend.typescript --project-root .
```

Статусы: `included`, `available`, `skipped`, `unknown`.

## `ai-skills status`

Показывает текущее состояние сгенерированных файлов.

```shell
ai-skills status --project-root .
```

## `ai-skills check`

Проверяет готовность проекта к синхронизации: конфигурацию, доступность
registry, читаемость skills, безопасность output paths и возможность собрать
активный набор правил.

```shell
ai-skills check --project-root .
```

## `ai-skills registry review`

Проверяет структуру и качество материалов registry, не генерируя файлы и не
изменяя registry. Ошибки дают ненулевой exit code, warnings не блокируют
проверку.

```shell
ai-skills registry review --project-root .
```
