# Registry Materials

Registry material — каноническая единица знания, которую AgentSync хранит,
отбирает через Composer и передает adapter-ам для генерации agent-specific
инструкций.

AgentSync различает три типа registry materials:

- `rule` — короткая норма поведения;
- `skill` — процедура выполнения определенного типа работы;
- `reference` — справочный материал, который агент читает по необходимости.

Это разделение нужно, чтобы не смешивать обязательные правила, рабочие
процедуры и длинный контекст в одном активном файле.

## Rule

Rule — короткое нормативное указание, которое влияет на поведение агента
при подходящей задаче.

Rule отвечает на вопрос: "что обязательно или желательно соблюдать?"

Признаки rule:

- формулируется как запрет, требование, предпочтение или проверка;
- обычно короткая и самодостаточная;
- не описывает полный рабочий процесс;
- может быть сгруппирована по scope, category и severity;
- подходит для включения в active context, если совпадает область
  применения.

Примеры:

- не менять публичный API без обновления contract tests;
- не использовать `any` в TypeScript;
- перед изменением зависимостей проверять lockfile и changelog;
- lifecycle hooks в Angular должны содержать только вызовы class methods.

Rule является основным материалом для generated rule-файлов. Критичные
rules могут попадать в `active-rules.md`; более подробные rules
раскладываются adapter-ом по category-файлам.

## Skill

Skill — поведенческий пакет для агента, который описывает, как выполнять
определенный тип работы end-to-end.

Skill отвечает на вопрос: "как агенту выполнить задачу такого класса?"

Признаки skill:

- имеет trigger-описание: когда его использовать;
- задает workflow, порядок анализа, уточнений, реализации и проверки;
- может ссылаться на `references/` вместо загрузки всех деталей сразу;
- может включать `scripts/` для повторяемых операций;
- может иметь `evals/` для проверки качества поведения;
- обычно доступен через task context или on-demand index, а не через
  постоянный active context.

Примеры:

- написать commit message по diff ветки;
- выполнить версионирование FastAPI API;
- оформить задачу в структурированный markdown;
- написать README приложения по корпоративному стандарту.

Хороший skill не является просто списком правил. Он ведет агента по
процедуре и снижает вероятность пропустить важные шаги.

## Reference

Reference — справочный материал, который агент читает только при
необходимости.

Reference отвечает на вопрос: "где взять подробный контекст или пример?"

Признаки reference:

- может быть длинным;
- не должен постоянно попадать в active context;
- содержит примеры, стандарты, архитектурные обзоры, шаблоны, карты
  модулей, глоссарии или доменные описания;
- подключается по ссылке из skill или через `skill-index.json`.

Примеры:

- пример README приложения;
- архитектура проекта;
- подробная схема OpenAPI-портала;
- шаблон постановки задачи;
- описание доменных сущностей.

## Отношение Между Типами

Rule, skill и reference не конкурируют друг с другом:

- rule задает норму;
- skill задает процедуру;
- reference дает подробный контекст.

Один skill может включать несколько коротких rules и ссылаться на
несколько references. Если материал можно выразить как самостоятельное
обязательное указание без workflow, его лучше хранить как rule. Если
материал одновременно содержит workflow и большой справочник, workflow
остается в `material.md`, а детали выносятся в `references/`.

## Registry Structure

Каноническая структура registry:

``` text
registry/
  rules/
    company/
    teams/
    projects/
  skills/
    <skill-name>/
      material.md
      references/
      scripts/
      evals/
  references/
    projects/
    domains/
    examples/
```

Directory-based skill является полноценной единицей поставки. Обязателен
только `material.md`; `references/`, `scripts/`, `evals/` и `assets/`
добавляются, когда они действительно нужны skill.

## Metadata

Каждый registry material должен иметь metadata, достаточную для
детерминированного отбора Composer-ом.

Базовые поля:

``` yaml
id: frontend.typescript
kind: rule
title: Frontend TypeScript Rules
summary: TypeScript-правила frontend-команды.
scope: team
loadMode: project
status: active
category: typescript
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["typescript"]
```

Поле `kind` определяет тип материала:

``` yaml
kind: rule | skill | reference
```

Для directory-based skills resources могут выводиться из структуры папки,
но в generated index их полезно хранить явно.

Пример:

``` yaml
entrypoint: material.md
resources:
  references:
    - references/STRUCTURE.md
    - references/EXAMPLES.md
  scripts:
    - scripts/copy_api_version.sh
  evals:
    - evals/evals.json
```

## Load Mode

`loadMode` определяет, как material попадает в контекст агента.

- `always` — минимальные критичные правила;
- `project` — активный проектный контекст;
- `task` — подключается при совпадении task type;
- `onDemand` — доступно через index, но не загружается в active context;
- `reference` — справочный материал, доступный по ссылке.

Практическое правило:

- `rule` чаще использует `always`, `project` или `task`;
- `skill` чаще использует `task` или `onDemand`;
- `reference` использует `reference`.

## Composer Behavior

Composer должен:

- включать подходящие active rules в generated rule-файлы;
- показывать task/on-demand skills в `skill-index.json`;
- показывать references в `skill-index.json`;
- не загружать все доступные materials в один active context;
- объяснять через `info`, почему material включен, доступен или пропущен.
- сортировать materials детерминированно без ручных numeric priority:
  по scope, severity, category и id.

Если правила одного уровня конфликтуют, это считается проблемой качества
registry, а не задачей сортировки. Такие конфликты должен выявлять
review/lint-процесс registry.

## Registry Review

Команда `ai-skills registry review --project-root .` выполняет
детерминированную проверку registry, указанного в `.ai-skills.json`. Она не
генерирует agent files и не изменяет materials.

Проверяются как минимум:

- соответствие `kind` расположению material в `rules/`, `skills/` или
  `references/`;
- запрет ручных полей порядка `priority` и `order`;
- `loadMode: reference` для references;
- ограничения `appliesTo` для `project`, `directory` и `taskType` scopes;
- базовые противоположные директивы в rules одинакового scope/category с
  пересекающимся `appliesTo`;
- дублирующийся текст material;
- Markdown-ссылки skill на отсутствующие bundled resources.

Ошибки завершают команду с ненулевым exit code. Warnings сообщают о
вероятных проблемах качества, например rule, похожем на многошаговый
workflow. Проверка дополняет ручной или агентный review, но не подменяет
смысловую оценку материалов.

## Adapter Behavior

Текущие native file layouts для всех поддерживаемых агентов описаны в
[Agent Adapters](agent-adapters.md).

Adapter должен преобразовывать registry materials в формат конкретного
агента без потери семантики.

Для Codex adapter:

- `AGENTS.md` остается коротким entrypoint;
- active rules раскладываются по category-файлам;
- on-demand skills и references остаются доступными через index;
- длинные references не попадают в active context автоматически.

## Критерии Классификации

Перед добавлением материала в registry нужно ответить:

1. Это короткая норма поведения?
   Тогда это `rule`.
2. Это процедура выполнения задачи с шагами, уточнениями и проверкой?
   Тогда это `skill`.
3. Это длинный контекст, пример или справочник?
   Тогда это `reference`.
