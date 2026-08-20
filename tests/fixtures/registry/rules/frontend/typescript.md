---
id: frontend.typescript
kind: rule
title: Frontend TypeScript Rules
summary: TypeScript-правила для frontend-приложений.
scope: team
loadMode: project
status: active
category: typescript
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-10
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["typescript", "angular"]
---

## Правила

- Не используй прямые literal values в коде; переноси local values в class fields, shared values в injection tokens, а value sets в enums.
- Не дроби constants без практической необходимости. Local config-only strings и numbers могут оставаться внутри config object; выноси constants только при reuse, domain significance или улучшении clarity.
- Enum names должны использовать префикс `E` и `PascalCase`, например `EAccountStatus`.
- Type alias names должны использовать префикс `T` и `PascalCase`, например `TAccountStatus`.
- Interface names должны использовать префикс `I` и `PascalCase`, например `IAccount`.
- Группируй enums, type aliases и interfaces в отдельные директории `enums`, `types` и `interfaces`.
- Файлы с constants, type aliases и enums называй в единственном числе по типу содержимого, даже если внутри несколько entities: `user-status-constant.ts`, `user-status-type.ts`, `user-status-enum.ts`. Не используй plural suffixes вроде `constants.ts`, `types.ts` или `enums.ts`.
- Если при добавлении очередного `enums`, `types` или `interfaces`, видишь что директория содержит больше трех entities, добавь `index.ts` barrel file для exports; пройдись по соответствующим imports и обнови пути.
- Enum members называй в `UPPER_SNAKE_CASE`. String values enum сохраняют формат, требуемый domain или API.
- Избегай логики длиннее одной строки внутри `subscribe` callbacks и RxJS operators; выноси ее в named methods.
- Не используй `any`; используй конкретный type или `unknown`, если тип действительно неизвестен.
- Не объявляй functions внутри class methods; выноси их в class methods.
- Если поле может быть `null`, и у него нет значения до пользовательского действия или загрузки данных, инициализируй его явно: `public file: File | null = null`. Не используй `!` для обычного nullable-состояния.
