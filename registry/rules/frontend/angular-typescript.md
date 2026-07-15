---
id: frontend.angular-typescript
kind: rule
title: Frontend Angular TypeScript Rules
summary: Angular-specific TypeScript правила для компонентов и signals.
scope: team
loadMode: project
status: active
category: typescript
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
  technologies: ["angular"]
---

## Правила

- Lifecycle hooks (`ngOnInit`, `ngAfterViewInit` и т.д.) могут содержать только calls class methods. Inline logic вроде conditions, assignments и call chains прямо внутри hooks является нарушением. `this.someMethod()` разрешен.
- Signal variable names, включая output signals, должны начинаться с префикса `$`.
- Переноси assignments из `ngOnInit` в class field initializers, если значение не зависит от component inputs или других initialization results.
- Держи class members в порядке: `Input`, `Output`, other decorators, public fields, protected fields, private fields, constructor, lifecycle hooks in call order, class methods, `ngOnDestroy` в самом конце.
- Constructor injections держи в порядке: decorators, public fields, protected fields, private fields.
- `!` допустим только там, где значение гарантированно будет присвоено фреймворком или внешним механизмом позже, например `@ViewChild`.
