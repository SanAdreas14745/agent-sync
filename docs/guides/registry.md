# Registry и его поставка

Основной способ поставки — отдельный Git-репозиторий с canonical каталогом
`registry/`. В `.ai-skills.json` хранится URL и отслеживаемый `ref`, а
`.ai-skills.lock.json` фиксирует полный resolved commit.

`ai-skills update` явно обновляет commit в lock-файле. `ai-skills sync`
воспроизводит уже зафиксированную версию: из локального кэша либо загружая
ровно этот commit из Git.

Файловый registry остаётся доступен для локальной разработки и тестов.
Режим `bundled` удалён в версии 2.0.0; проекты с такой конфигурацией должны
перейти на Git registry.

## Материалы registry

Registry содержит Markdown-файлы с YAML frontmatter. Полная модель материалов
описана в [Registry Materials](../concepts/registry-materials.md).

Кратко:

- `rule` задаёт норму поведения;
- `skill` описывает процедуру выполнения задачи;
- `reference` хранит подробный справочный контекст.

```text
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

`rules/` содержит короткие нормы, которые Composer может включить в активный
контекст. `skills/` содержит directory-based процедуры; обязателен только
`material.md`, а объёмные примеры и справочники размещаются в `references/`
внутри skill. Корневой `references/` предназначен для справочных материалов,
которые индексируются, но не загружаются в активный контекст.
