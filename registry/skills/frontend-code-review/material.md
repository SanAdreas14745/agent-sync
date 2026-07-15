---
id: frontend.code-review
kind: skill
title: Frontend Code Review
summary: Процесс review frontend-изменений. Использовать, когда пользователь просит сделать review, code review или проверить diff/ветку на ошибки.
scope: team
loadMode: onDemand
status: active
category: verification
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
  technologies: ["typescript", "angular"]
---

# Frontend Code Review

## Workflow

1. Не превращай обычную задачу реализации в review: используй этот skill только при явной просьбе о review.
2. Определи границы review: diff, ветка, список файлов или указанный пользователем scope.
3. Проверь изменения на bugs, regressions, missing tests и risks поддержки.
4. Сопоставь изменения с активными правилами проекта, технологий и релевантных category-файлов.
5. В findings указывай конкретные файлы и строки.
6. Начинай ответ с actionable findings, отсортированных по severity.
7. Краткое резюме и тестовые пробелы оставляй после findings.

## Формат Ответа

- Если есть проблемы, сначала перечисли findings.
- Если проблем не найдено, скажи это явно.
- Укажи residual risk или test gaps, если проверка была неполной.
