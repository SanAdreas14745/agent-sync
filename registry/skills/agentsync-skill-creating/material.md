---
id: agentsync.skill-creating
kind: skill
title: AgentSync Skill Creating
summary: Создание и редактирование AgentSync registry skills. Использовать, когда нужно написать новый skill, улучшить существующий skill или подготовить skill к переносу в registry.
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

# Создание Скиллов AgentSync

## Главный Принцип

Скилл должен быть полноценной рабочей сущностью, а не большим Markdown-файлом.

Держи `material.md` коротким: в нем должны быть trigger, назначение, основной
workflow и ссылки на дополнительные материалы. Подробную структуру,
шаблоны и примеры выноси в `references/`.

## Базовая Структура

``` text
skill-name/
  material.md
  references/
    STRUCTURE.md
    EXAMPLES.md
```

`material.md` обязателен. `references/STRUCTURE.md` и
`references/EXAMPLES.md` добавляй по умолчанию для всех нетривиальных
скиллов.

Подробные требования к структуре см. в [references/STRUCTURE.md](references/STRUCTURE.md).

## Workflow

1. Определи, является ли материал скиллом, правилом или справкой.
2. Если это скилл, опиши в `material.md` только то, что нужно агенту для старта работы.
3. Вынеси подробную структуру в `references/STRUCTURE.md`.
4. Вынеси примеры в `references/EXAMPLES.md`.
5. Проверь, что `material.md` не дублирует reference-файлы.
6. Проверь, что ссылки из `material.md` ведут на все важные reference-файлы.
7. После создания или изменения registry material используй skill `agentsync.registry-material-validation`.

## Связанные Скиллы

После подготовки material обязательно используй
`agentsync.registry-material-validation`, чтобы проверить classification,
frontmatter, scope, loadMode, appliesTo, отсутствие `priority` и возможные
конфликты с существующими registry materials.
