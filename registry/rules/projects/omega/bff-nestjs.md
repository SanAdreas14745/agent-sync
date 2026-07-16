---
id: project.omega.bff-nestjs
kind: rule
title: Omega BFF NestJS Rules
summary: Проектные правила Omega для NestJS BFF.
scope: project
loadMode: project
status: active
category: bff
severity: required
version: 1
owner: frontend
updatedAt: 2026-07-09
appliesTo:
  projects: ["omega"]
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
  technologies: ["nestjs"]
---

## Правила

- В Omega BFF используй `ApiService` из `modules/api/services` и передавай backend project name отдельным аргументом, если этого требует соседний code path, например `'stat'`.
- Для ошибок используй `ErrorHandlerService.throwNewError(...)`, если соседний module уже следует этому pattern.
- Для controller в Omega-style modules сохраняй `BackendHandlerNameInterceptor`, если соседние endpoints используют `backendHandlerName`.
- Если `ApiService` возвращает `backendHandlerName`, сохраняй его при ручной сборке `IDataResponse<T>`.
- В Omega BFF для imports повторяй стиль соседних файлов: `shared` часто импортируется relative path вроде `../../../../shared/...`, а local DTO/services/utils — через `../dto/...`, `../services/...`, `../utils/...`. Не заменяй это на alias import, если рядом в этом module alias не используется.
