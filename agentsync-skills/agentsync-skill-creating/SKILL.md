---
name: agentsync-skill-creating
description: Локальный скилл AgentSync для создания и редактирования registry skills. Использовать, когда нужно написать новый skill, улучшить существующий skill, решить что оставить в локальном SKILL.md или registry material.md, что вынести в references/EXAMPLES.md или references/STRUCTURE.md, либо подготовить skill к переносу в registry.
---

# Создание Скиллов AgentSync

Этот скилл применяется только внутри проекта AgentSync.

## Главный Принцип

Скилл должен быть полноценной рабочей сущностью, а не большим Markdown-файлом.

Держи entrypoint коротким: для локального Codex skill это `SKILL.md`, для
registry skill это `material.md`. В entrypoint должны быть trigger,
назначение, основной workflow и ссылки на дополнительные материалы.
Подробную структуру, шаблоны и примеры выноси в `references/`.

## Базовая Структура

``` text
skill-name/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

Для registry skill обязателен `material.md`. `references/STRUCTURE.md` и
`references/EXAMPLES.md` добавляй по умолчанию для всех нетривиальных
скиллов.

Для локального Codex skill в `agentsync-skills/` entrypoint остается
`SKILL.md`, потому что IDE и Codex skill validators ожидают именно это имя.

Подробные требования к структуре см. в [references/STRUCTURE.md](references/STRUCTURE.md).

## Что Держать В Entrypoint

- YAML frontmatter: для локального Codex skill — `name` и `description`,
  для registry skill — metadata registry material.
- Краткое назначение скилла.
- Основной workflow.
- Правила выбора дополнительных reference-файлов.
- Короткий чек-лист самопроверки.

Не помещай в entrypoint длинные примеры, подробные шаблоны, историю
решений, исследовательские заметки или полные структуры документов.

## Что Выносить В References

- `STRUCTURE.md` — подробная структура результата, разделы, обязательность, критерии качества.
- `EXAMPLES.md` — примеры хороших и плохих вариантов, мини-кейсы, образцы фрагментов.
- Дополнительные reference-файлы — только когда один из файлов становится слишком широким или появляется отдельный домен.

Примеры оформления см. в [references/EXAMPLES.md](references/EXAMPLES.md).

## Workflow

1. Определи, является ли материал скиллом, правилом или справкой.
2. Если это registry skill, опиши в `material.md` только то, что нужно агенту для старта работы.
3. Вынеси подробную структуру в `references/STRUCTURE.md`.
4. Вынеси примеры в `references/EXAMPLES.md`.
5. Проверь, что entrypoint не дублирует reference-файлы.
6. Проверь, что ссылки из entrypoint ведут на все важные reference-файлы.
7. После создания или изменения registry material используй skill `agentsync-registry-material-validation`.

## Связанные Скиллы

После подготовки material обязательно используй
`agentsync-registry-material-validation`, чтобы проверить classification,
frontmatter, scope, loadMode, appliesTo, отсутствие `priority` и возможные
конфликты с существующими registry materials.

## Связь С Документационной Политикой

Локальные project-specific skills AgentSync держи в корневой директории `agentsync-skills/`.

Если skill становится частью принятой модели AgentSync, его нужно переписать в финальную форму и затем синхронизировать с `docs/glossary.md` и другими связанными документами.
