---
id: bff.nestjs
kind: rule
title: BFF NestJS Rules
summary: NestJS BFF правила для frontend-зоны ответственности.
scope: team
loadMode: project
status: active
category: bff
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["nestjs"]
---

## Правила

- Перед изменением или созданием BFF module сначала проверь соседние modules текущего проекта: layout, imports, guards, interceptors, `ApiService`, error handling и response envelope.
- Маленький module можно держать плоским: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`; большой module разделяй на `controllers/`, `services/`, `dto/<subdomain>/`, `interfaces/`, `enums/`, `utils/`.
- В `*.module.ts` регистрируй только нужные `controllers` и `providers`; imports добавляй только при реальной зависимости от другого Nest module.
- Если создаешь новый feature module, добавь его в app-level module проекта по существующему локальному порядку импортов.
- Controller должен быть тонким: route decorators, Swagger decorators, чтение `@Body`, `@Param`, `@Context` и вызов service.
- Не размещай в controller backend mapping, casing conversion, сложную подготовку payload или обработку ошибок.
- Простая диспетчеризация допустима в controller, если она относится к frontend route contract; если логика растет, перенеси ее в service или helper.
- На уровне controller используй auth/security decorators, guards и interceptors, принятые в соседних endpoints текущего проекта.
- Для Swagger endpoint всегда добавляй `@ApiOperation` с русским summary.
- Для response используй проектный response decorator/helper, если он есть, а не ручное описание одинаковой response wrapper-структуры в каждом endpoint.
- Для request body добавляй `@ApiBody({ type: SomeDto })`, кроме случаев, где endpoint реально не имеет payload или проект явно использует optional empty body.
- Для route params добавляй `@ApiParam` с описанием.
- Тип возвращаемого значения controller должен соответствовать реальной BFF response wrapper-конвенции проекта.
- Передавай `IContext` в service явно и не доставай `token` / `organizationSlug` в controller.
- Service отвечает за orchestration: вызов `ApiService`, выбор backend path, подготовку request body/query params, преобразование response и error handling.
- В service method destructure context прямо в сигнатуре, если нужны только `token` и `organizationSlug`: `{ token, organizationSlug }: IContext`.
- Передавай в `ApiService` только тот props shape и дополнительные аргументы, которые приняты в текущем проекте.
- Backend paths держи в service рядом с вызовом backend API; не выноси их в общий слой без реальной повторяемости.
- Если backend и frontend используют разный casing, применяй существующие shared helpers вроде `camelToSnake` и `snakeToCamel`.
- Не инлайни крупные преобразования request/response в service; выноси их в local utils рядом с module, например `utils/prepare-*.util.ts`.
- Для сложной подготовки payload предпочитай создавать `preparedBody`, а не мутировать incoming DTO.
- Если общий `ApiService` возвращает технические metadata поля, которые нужны frontend/debug tooling, сохраняй их при ручной сборке response.
- Для frontend-facing списков и таблиц возвращай структуру, которую описывает DTO и response decorator, даже если backend envelope отличается.
- Получай dependencies через constructor injection; не создавай services или clients вручную через `new`.
- Не обращайся к `process.env` напрямую в module code; используй `ConfigService` или typed configuration.
- К базе обращайся только через ORM/client проекта; не пиши raw SQL без понятной необходимости и не обходи repository/service layers.
- Ошибки backend должны превращаться в Nest HTTP exceptions, а не уходить наружу как raw Axios errors.
- Для 401/403/404/400/422 используй существующий project error handler, если он есть.
- Для custom user-facing messages передавай сообщение в общий error handler или бросай typed exception рядом с проверкой.
- Не используй `any` для ошибок без необходимости; если legacy-код проекта уже так делает, не расширяй эту практику в новых местах.
- Перед созданием нового типового DTO проверь, нет ли аналога в `shared`.
- DTO описывают контракт BFF для frontend generation; не копируй backend DTO механически, если frontend получает другой shape.
- Разделяй request и response DTO по назначению: `*RequestDto`, `*ResponseDto`, `*ListDto`, domain-specific DTO.
- Каждый публичный DTO field должен иметь `@ApiProperty` или `@ApiPropertyOptional` с русским `description`.
- Optional fields должны согласовывать TypeScript type, Swagger и validation: `T | null`, `nullable: true`, `required: false` или `ApiPropertyOptional`, `@IsOptional()`.
- Для enum fields указывай `enum` и `enumName`, чтобы frontend API client генерировал переиспользуемый enum.
- Nested DTOs валидируй через `@ValidateNested` и `@Type(() => DtoClass)`; для массивов используй `@ValidateNested({ each: true })`.
- Для request DTO arrays добавляй `@IsArray`.
- Не добавляй `example` в Swagger decorators.
- Не создавай пустой request DTO для endpoint без payload.
- Считай frontend contract первичным для BFF endpoint: route name, DTO names и response shape должны быть удобны frontend, а backend quirks прячутся внутри service/utils.
- Non-trivial mapping должен быть чистой функцией в `utils/`.
- Если backend возвращает лишние поля, можно удалить или не прокидывать их в BFF response, но это должно быть явно видно в service/util.
- Если backend возвращает разные envelope formats, нормализуй их к проектной BFF convention перед возвратом в controller.
- Используй существующий `@Context()` decorator и `IContext`; не парси headers вручную в controller.
- Не формируй authorization headers в feature service вручную, если это уже делает общий `ApiService`.
- Temporary mock-only constants, stores, interfaces/types и helper functions держи вместе в одном явно названном mock file внутри local module, чтобы mock layer можно было позже удалить сфокусированным изменением.
- Для DTO и Swagger contract changes открой reference `reference.bff.nestjs-swagger-contracts` из `skill-index.json`.
