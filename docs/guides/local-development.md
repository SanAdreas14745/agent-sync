# Локальная разработка AgentSync

Этот документ предназначен для участников, работающих с исходным кодом
AgentSync.

## Базовая проверка

В PowerShell используйте `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd test
npm.cmd run verify
```

`verify` проверяет publish-архив без публикации.

## Smoke-проверка глобального CLI

После сборки можно проверить пакет как глобально установленный CLI:

```powershell
npm.cmd install -g .
ai-skills --version
ai-skills check --project-root <путь-до-тестового-проекта>
ai-skills update --project-root <путь-до-тестового-проекта>
ai-skills sync --project-root <путь-до-тестового-проекта>
ai-skills status --project-root <путь-до-тестового-проекта>
```

Команды `check`, `sync` и `status` должны завершаться без ошибок; `sync`
должна создать generated-файлы в тестовом проекте.

## Проверка внешнего проекта из исходников

```shell
node ./dist/cli.js check --project-root <путь-до-проекта>
node ./dist/cli.js update --project-root <путь-до-проекта>
node ./dist/cli.js sync --project-root <путь-до-проекта>
node ./dist/cli.js status --project-root <путь-до-проекта>
```
