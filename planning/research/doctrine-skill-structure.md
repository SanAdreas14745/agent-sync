# Doctrine Skill Structure Research

Статус: исследовательская заметка.

Эта заметка фиксирует наблюдения по проекту `W:\Работа\Projects\Doctrine`.
Она не является финальной документацией AgentSync. Принятая модель
registry materials описана в `docs/concepts/registry-materials.md`.

## Что Обнаружено

В `Doctrine` skill не сводится к одному Markdown-файлу. Skill оформлен
как переносимая директория:

``` text
skill-name/
  SKILL.md
  references/
  scripts/
  evals/
  assets/
  agents/
```

Обязательным является только `SKILL.md`. Остальные директории появляются,
когда skill нужны справочные материалы, детерминированные скрипты,
тестовые сценарии, ассеты или инструкции для вспомогательных агентов.

## Полезные Практики

Из `Doctrine` для AgentSync полезны следующие практики:

- directory-based skill как полноценная единица поставки;
- `SKILL.md` как короткий entrypoint с trigger description и workflow;
- `references/` для progressive disclosure;
- `scripts/` для повторяемых операций, которые не нужно каждый раз
  изобретать в чате;
- `evals/` для проверки качества сложных skills;
- отдельные human docs, которые объясняют skill людям, но не заменяют
  agent-facing `SKILL.md`.

## Что Не Переносить Напрямую

Не стоит переносить без изменений:

- отсутствие явного разделения между rule и skill в публичной модели;
- слишком жесткие универсальные инструкции, если они конфликтуют с
  локальными практиками проекта;
- agent-specific расположение вроде `.cursor/skills` как каноническую
  модель AgentSync.

В AgentSync agent-specific расположение должен определять adapter, а не
канонический registry.

## Вывод Для AgentSync

Практика `SKILL.md` + bundled resources принята для локальных skills
AgentSync. Для этого в корне проекта используется директория
`agentsync-skills/`.

Для canonical registry финальная модель описана отдельно: `rule`, `skill`
и `reference` являются разными типами registry materials.

