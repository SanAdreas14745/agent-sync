---
id: agentsync.registry-material-validation
kind: skill
title: AgentSync Registry Material Validation
summary: Проверка создаваемых или изменяемых AgentSync registry materials. Использовать после добавления или редактирования rule, skill или reference.
scope: project
loadMode: onDemand
status: active
category: verification
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["agentsync"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
---

# Валидация Registry Materials AgentSync

## Главный Принцип

Registry material должен быть понятен агенту, узко применим и правильно
классифицирован как `rule`, `skill` или `reference`.

Ручных numeric priority/order нет. Если два материала одного уровня
конфликтуют, это нужно выявить как проблему качества registry, а не
маскировать сортировкой.

## Когда Читать References

- Читай [STRUCTURE.md](references/STRUCTURE.md), когда нужно проверить
  frontmatter, расположение файла, `kind`, `loadMode`, `appliesTo` или
  bundled resources.
- Читай [EXAMPLES.md](references/EXAMPLES.md), когда нужен пример ошибки
  классификации, слишком широкого правила или корректной связи skill с
  reference.

## Workflow

1. Определи, какой material проверяется: `rule`, `skill` или `reference`.
2. Проверь, что `kind` совпадает с содержанием, а не только с расположением файла.
3. Проверь frontmatter: обязательные поля, отсутствие `priority`, корректные `scope`, `loadMode`, `category`, `severity`, `appliesTo`.
4. Проверь расположение: `rule` в `registry/rules/`, `skill` в `registry/skills/<name>/material.md`, `reference` в `registry/references/`.
5. Проверь, не слишком ли широко применяется material. При необходимости предложи сузить по project, technology или path.
6. Проверь конфликты с существующими materials того же scope/category/technology.
7. Для `skill` проверь, что `material.md` короткий, процедурный и ссылается на нужные bundled resources.
8. Для `reference` проверь, что он не должен быть активным правилом и не дублирует `material.md`.
9. Запусти доступные проверки проекта.

## Чек-Лист

- Material имеет правильный `kind`.
- В frontmatter нет `priority` или другого ручного порядка.
- `loadMode` соответствует `kind`.
- `appliesTo` не шире, чем нужно.
- Нет очевидного конфликта с существующим material того же уровня.
- Для skill есть trigger в `summary` и workflow в body.
- Для reference понятно, кто и когда должен его читать.
- Registry читается без validation issues.
