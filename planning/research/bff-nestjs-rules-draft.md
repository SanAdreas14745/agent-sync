# BFF NestJS Rules Draft

Статус: черновик после сравнения модулей:

- `W:\Работа\Projects\Omega\omega-1\apps\bff\src\app\modules\nps`
- `W:\Работа\Projects\BrandApp\BrandApp-1\apps\bff\src\app\modules\badges`

Документ не является активным registry rule. Его цель - собрать правила,
которые после ревью можно ужать и перенести в `registry/rules/bff/`.

## Общие Наблюдения

BFF в обоих проектах работает как тонкая прослойка между frontend API и
backend API:

- controller задает frontend route, Swagger-контракт, auth/security
  decorators и передает запрос в service;
- service достает `token` и `organizationSlug` из `IContext`, вызывает
  общий `ApiService`, адаптирует backend payload/response и обрабатывает
  ошибки;
- DTO описывают публичный frontend-facing контракт BFF, а не обязательно
  сырой backend-контракт;
- несоответствия контрактов решаются через `camelToSnake`, `snakeToCamel`
  и локальные `prepare-*.util.ts`.

## Кандидаты В Правила

### Структура Модуля

- Для нового BFF module сначала проверь соседние modules текущего проекта:
  layout, import aliases, guards, interceptors, `ApiService` signature,
  error handling и response envelope.
- Маленький module можно держать плоским: `*.controller.ts`,
  `*.service.ts`, `*.module.ts`, `dto/`.
- Большой module разделяй по локальным папкам: `controllers/`, `services/`,
  `dto/<subdomain>/`, `interfaces/`, `enums/`, `utils/`.
- В `*.module.ts` регистрируй только нужные `controllers` и `providers`.
  Imports добавляй только при реальной зависимости от другого Nest module.
- Если создаешь новый feature module, добавь его в app-level module проекта
  по существующему локальному порядку импортов.

### Controllers

- Controller должен быть тонким: route decorators, Swagger decorators,
  чтение `@Body`, `@Param`, `@Context` и вызов service.
- Не размещай в controller backend mapping, casing conversion, сложные
  условия подготовки payload или обработку ошибок.
- Простая диспетчеризация допустима в controller, если она относится к
  frontend route contract, например выбор create/update backend path по
  наличию `body.id`. Если логика растет, перенеси ее в service/helper.
- На уровне controller используй auth/security decorators, принятые в
  проекте: например `@ApiSecurity('OpenIDToken')`,
  `@ApiBearerAuth('organization-slug')`, project guard/interceptor.
- Для Swagger endpoint всегда добавляй `@ApiOperation` с русским summary.
- Для response используй проектный `ApiResponseDecorator`, а не ручное
  описание одинаковой response wrapper-структуры в каждом endpoint.
- Для request body добавляй `@ApiBody({ type: SomeDto })`, кроме случаев,
  где endpoint реально не имеет payload или проект явно использует
  optional empty body.
- Для route params добавляй `@ApiParam` с описанием.
- Тип возвращаемого значения controller должен соответствовать реальной
  BFF обертке: direct DTO, `IDataResponse<T>`, `Promise<object>` или
  проектный success DTO.
- Передавай `IContext` в service явно и не доставай `token` /
  `organizationSlug` в controller.

### Services

- Service является местом orchestration: вызов `ApiService`, выбор backend
  path, подготовка request body/query params, преобразование response и
  error handling.
- В service method destructure context прямо в сигнатуре, если нужны только
  `token` и `organizationSlug`:
  `{ token, organizationSlug }: IContext`.
- Передавай в `ApiService` только тот shape props и дополнительные
  аргументы, которые приняты в текущем проекте.
- Backend paths держи в service рядом с вызовом backend API. Не выноси их в
  общий слой без реальной повторяемости.
- Если backend ожидает snake_case, применяй общий `camelToSnake` перед
  вызовом. Если frontend ожидает camelCase, применяй `snakeToCamel` на
  response.
- Не инлайни крупные преобразования request/response в service. Выноси их
  в локальные `utils/prepare-*.util.ts`.
- Для сложной подготовки payload предпочитай создавать `preparedBody`,
  а не мутировать incoming DTO.
- Если `ApiService` возвращает `backendHandlerName`, сохраняй его при
  ручной сборке response.
- Для frontend-facing списков и таблиц возвращай структуру, которую
  описывает DTO и `ApiResponseDecorator`, даже если backend envelope
  отличается.
- Не проглатывай ошибки. Используй проектный механизм обработки ошибок.
- Если backend success flag требует дополнительной проверки, бросай Nest
  HTTP exception с понятным сообщением, как `UnprocessableEntityException`.

### DTO И Swagger Contract

- Перед созданием нового типового DTO, убедись что у него нет аналога в папке shared.
- DTO описывают контракт BFF для frontend generation. Не копируй backend
  DTO механически, если frontend получает другой shape.
- Разделяй request и response DTO по назначению: `*RequestDto`,
  `*ResponseDto`, `*ListDto`, domain-specific DTO.
- Каждый публичный DTO field должен иметь `@ApiProperty` или
  `@ApiPropertyOptional` с русским `description`.
- Optional fields должны согласовывать TypeScript type, Swagger и
  validation: `T | null`, `nullable: true`, `required: false` или
  `ApiPropertyOptional`, `@IsOptional()`.
- Для enum fields указывай `enum` и `enumName`, чтобы frontend API client
  генерировал переиспользуемый enum.
- Для nested DTO добавляй `@ValidateNested` и `@Type(() => NestedDto)`;
  для массивов - `@ValidateNested({ each: true })` и `type: [NestedDto]`.
- Для массивов добавляй `@IsArray`, если field приходит в request DTO.
- Не добавляй `example` в Swagger decorators.
- Не создавай пустой request DTO для endpoint без payload.

### Request/Response Mapping

- Считай frontend contract первичным для BFF endpoint: route name, DTO names
  и response shape должны быть удобны frontend, а backend quirks прячутся
  внутри service/utils.
- Все casing conversions делай через существующие shared helpers, а не
  ручным перебором полей в controller/service.
- Non-trivial mapping должен быть чистой функцией в `utils/`.
- Если backend возвращает лишние поля, можно удалить или не прокидывать их
  в BFF response, но это должно быть явно видно в service/util.
- Если backend возвращает разные envelope formats, нормализуй их к проектной
  BFF convention перед возвратом в controller.

### Security И Context

- Используй существующий `@Context()` decorator и `IContext`; не парси
  headers вручную в controller.
- Не формируй authorization headers в feature service вручную, если это уже
  делает общий `ApiService`.
- При добавлении endpoint повторяй project auth pattern, guards и
  interceptors соседних endpoints.
- Не смешивай project-specific decorators и import styles без проверки
  app/shared packages текущего проекта.

### Ошибки И Валидация

- Ошибки backend должны превращаться в Nest HTTP exceptions, а не уходить
  наружу как raw Axios errors.
- Для 401/403/404/400/422 используй существующий project error handler,
  если он есть.
- Для custom user-facing messages передавай сообщение в общий error handler
  или бросай typed exception рядом с проверкой.
- Не используй `any` для ошибок без необходимости. Если проект пока так
  делает, не расширяй эту практику в новых местах.

## Предложение Для Переноса В Registry

После ревью этот черновик разделен:

- общие правила перенесены в `registry/rules/bff/nestjs.md`;
- project-specific развилки вынесены в project rules;
- checklist работы с BFF не переносится в rules и должен оформляться как
  отдельный skill, если понадобится;
- оставить Swagger-specific детали в существующем
  `registry/references/bff/nestjs-swagger-contracts.md`, чтобы не
  дублировать правила DTO.
