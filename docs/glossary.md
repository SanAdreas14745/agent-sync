# Glossary

Этот словарь фиксирует принятую терминологию AgentSync.

## Registry Material

Registry material — каноническая единица знания, которую AgentSync хранит,
отбирает через Composer и передает adapter-ам для генерации agent-specific
инструкций.

Типы registry materials:

- `rule`;
- `skill`;
- `reference`.

Подробная модель описана в [Registry Materials](./concepts/registry-materials.md).

## Rule

Rule — короткая норма поведения агента.

Rule задает, что обязательно или желательно соблюдать в подходящем
контексте. Rule не описывает полный workflow выполнения задачи.

## Skill

Skill — процедура выполнения определенного типа работы.

Skill описывает workflow, порядок анализа, уточнений, реализации и
проверки. Skill может ссылаться на references, scripts и evals.

## Reference

Reference — справочный материал, который агент читает по необходимости.

Reference содержит длинный контекст, примеры, стандарты, архитектурные
обзоры, шаблоны, карты модулей, глоссарии или доменные описания.

## Composer

Composer — компонент AgentSync, который определяет, какие registry
materials подходят текущему проекту, агенту, task type, технологиям и
путям.

## Adapter

Adapter — компонент AgentSync, который преобразует canonical registry
materials в формат конкретного AI-агента.

## Active Context

Active context — набор инструкций, который adapter загружает агенту как
постоянно активный рабочий контекст.

Active context должен быть минимальным и релевантным. On-demand skills и
references не должны попадать в него автоматически.

## Registry Review

Registry review — детерминированная проверка качества registry materials.

Команда `ai-skills registry review` проверяет структуру, способы загрузки,
ограничения применения, базовые конфликты, дублирование и ссылки на bundled
resources до публикации или rollout-а registry.

## Load Mode

Load mode — режим загрузки registry material в контекст агента.

Основные значения:

- `always`;
- `project`;
- `task`;
- `onDemand`;
- `reference`.
