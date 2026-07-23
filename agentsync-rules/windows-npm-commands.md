# Windows Npm Commands

Локальное правило AgentSync для работы в PowerShell на Windows.

## Правила

- Если shell окружения - PowerShell на Windows, запускай npm scripts через `npm.cmd`, например `npm.cmd test`, `npm.cmd run build`, `npm.cmd install`.
- Не используй `npm <script>` в PowerShell на Windows: вызов может попасть в `npm.ps1` и упереться в execution policy.
- В не-Windows окружении следуй локальному shell convention проекта.
- Перед выпуском новой версии npm-пакета синхронизируй версию в `package.json`, `package-lock.json` и README-команде глобальной установки `npm.cmd install --global @harness-system/pb-agent-sync@<version>`.
