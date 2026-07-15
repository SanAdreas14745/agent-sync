# Этап 2. Composer / Resolver

Статус: planning-документ.

Этот документ фиксирует рабочий план и критерии готовности этапа MVP.

## Цель

Реализовать центральный компонент системы: модуль, который выбирает
минимальный достаточный набор правил для конкретного проекта, агента и
типа задачи.

## Роль в архитектуре

Composer не должен знать, как именно будут записаны файлы для Codex,
Cursor или Claude. Его задача --- принять registry и контекст, вернуть
объяснимый resolved-набор.

``` text
Registry
  -> Composer / Resolver
  -> ResolveResult
  -> Agent Adapter
```

## Входные данные

``` ts
interface ResolveContext {
  project: string;
  agent: 'codex';
  taskType?: string;
  paths?: string[];
  technologies?: string[];
}
```

``` ts
interface RegistrySkill {
  id: string;
  title: string;
  summary: string;
  body: string;
  scope: SkillScope;
  loadMode: LoadMode;
  status: SkillStatus;
  version: number;
  owner: string;
  updatedAt: string;
  appliesTo: AppliesTo;
  sourceFile: string;
}
```

## Выходные данные

``` ts
interface ResolveResult {
  included: ResolvedSkill[];
  skipped: SkippedSkill[];
  warnings: ComposerWarning[];
  manifest: ResolveManifest;
}
```

``` ts
interface ResolvedSkill {
  id: string;
  title: string;
  summary: string;
  body: string;
  scope: SkillScope;
  loadMode: LoadMode;
  version: number;
  sourceFile: string;
  includeReason: string;
}
```

``` ts
interface SkippedSkill {
  id: string;
  title: string;
  reason: string;
}
```

## Алгоритм MVP

1.  Принять список нормализованных скиллов.
2.  Исключить `draft`, `deprecated`, `disabled`.
3.  Исключить скиллы, не подходящие текущему агенту.
4.  Исключить скиллы, не подходящие проекту.
5.  Исключить task-скиллы, если `taskType` не совпадает.
6.  Исключить path-specific скиллы, если ни один путь не совпал.
7.  Разделить подходящие скиллы по `loadMode`.
8.  Включить в active-набор:
    -   `always`;
    -   `project`;
    -   `task`, если совпал `taskType`.
9.  Поместить `onDemand` и `reference` в индекс, но не в active-набор.
10. Отсортировать active-набор.
11. Сформировать warnings.
12. Сформировать manifest.

## Порядок сортировки

Сортировка должна быть детерминированной.

Рекомендуемый порядок scope:

``` text
company
team
project
directory
taskType
```

Внутри одного scope:

``` text
severity ASC
category ASC
id ASC
```

Ручных numeric priority/order в authoring-интерфейсе нет. Если правила
одного уровня конфликтуют, это проблема качества registry, а не задача
сортировки.

## Объяснимость

Composer должен уметь ответить на вопрос:

``` bash
ai-skills info frontend.code-review
```

Возможные причины включения:

``` text
included: status active
included: agent codex matches appliesTo.agents
included: project statistics matches appliesTo.projects
included: taskType code-review matches appliesTo.taskTypes
```

Возможные причины исключения:

``` text
skipped: status deprecated
skipped: agent cursor does not match current agent codex
skipped: project billing does not match current project statistics
skipped: taskType refactoring does not match current taskType code-review
skipped: loadMode reference is not included in active context
```

## Warnings

MVP warnings:

-   duplicate skill id;
-   missing required field;
-   invalid status;
-   invalid loadMode;
-   deprecated skill found;
-   active skill has empty body;
-   reference is too large for inline usage;
-   skill matches project but not current agent.

## Token budget

Для диагностики можно использовать приблизительную оценку:

``` text
estimatedTokens = Math.ceil(text.length / 4)
```

Это не реальный tokenizer и не является основанием для автоматического
обрезания правил. Composer не должен обрезать body в MVP.
Автоматическую политику token budget можно добавить позже отдельным
решением.

## Тесты

Минимальные тестовые сценарии:

-   включает company/team/project правила;
-   исключает draft/deprecated/disabled;
-   исключает правила другого агента;
-   включает task-rule только при совпадении `taskType`;
-   не включает reference в active-набор;
-   сортирует результат стабильно;
-   возвращает skipped reason;
-   одинаковый input дает одинаковый output.

## Критерии готовности

-   Composer не зависит от CLI;
-   Composer не зависит от Codex adapter;
-   Composer покрыт unit-тестами;
-   output содержит included, skipped, warnings и manifest;
-   `info` можно реализовать поверх данных Composer-а;
-   порядок resolved-набора стабилен.

## Выход этапа

Готовый ResolveResult, который можно передавать adapter-у без повторного
анализа registry.
