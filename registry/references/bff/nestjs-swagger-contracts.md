---
id: reference.bff.nestjs-swagger-contracts
kind: reference
title: BFF NestJS Swagger Contract Reference
summary: Справочник по DTO, Swagger decorators и BFF contract handoff.
scope: team
loadMode: reference
status: active
category: bff
severity: recommended
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  agents: ["codex"]
  technologies: ["nestjs"]
---

## DTO И Swagger

- Описывай DTO через `class-validator` decorators и `@ApiProperty` / `@ApiPropertyOptional` из `@nestjs/swagger`.
- Optional fields должны использовать `@ApiPropertyOptional` или `required: false` вместе с `@IsOptional`.
- Для каждого DTO field добавляй `@ApiProperty()` или `@ApiPropertyOptional()` с `description`; добавляй `enum`, если field использует enum, и `type`, если field использует explicit type. Не добавляй `example` в DTO Swagger decorators.
- Для enum-полей в Swagger DTO всегда указывай `enumName` вместе с `enum`, если enum должен генерироваться во frontend-клиенте как самостоятельная модель. Пример: `enum: ERegistrationLoginMethod, enumName: 'ERegistrationLoginMethod'`. Это помогает избежать вложенных enum вроде `PagesDesignUpdateSettingsRequestDto.PrimaryLoginMethodEnum` и переиспользовать общий enum в сгенерированном API-клиенте.
- Для nullable DTO fields используй `nullable: true` в Swagger decorator, TypeScript type оставляй как `T | null`, и используй matching base validator вместе с `@IsOptional()`, например `@IsString()` и `@IsOptional()` для `string | null`.
- Если endpoint contract не имеет payload или явно использует empty payload `{}`, не создавай empty request DTO и не добавляй `@Body()` или `@ApiBody()` для этого endpoint.
- Для методов BFF controllers всегда добавляй Swagger `description` на русском языке.

## BFF И Frontend Generation

- В BFF services следуй стилю соседних services в том же module. Для proxy methods с `IContext` предпочитай destructuring context в method signature, например `({ token, organizationSlug }: IContext, body: SomeRequestDto)`, вместо unused-style names вроде `_context` / `_body`.
- При передаче данных между BFF и upstream APIs используй существующие casing helpers вроде `snakeToCamel` и `camelToSnake`, если source и target contracts используют разный casing. Не инлайни large casing или mapping logic в controllers/services.
- После изменения BFF Swagger contracts не запускай frontend API code generation и не редактируй generated frontend API files.
- В final report укажи, что BFF готов для frontend generation. Пользователь проверит BFF changes и запустит generation вручную.
