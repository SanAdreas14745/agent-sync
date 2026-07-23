# Публикация внутреннего пакета

Workflow [publish-package.yml](../../.github/workflows/publish-package.yml)
публикует пакет после создания GitHub Release с тегом
`v<версия из package.json>`.

Перед первым релизом maintainer добавляет в Actions secret
`GH_PACKAGES_TOKEN`: classic GitHub PAT с `write:packages` для namespace
`@harness-system`. Секрет не добавляется в код и `.npmrc`.

Перед созданием Release выполните в PowerShell:

```powershell
npm.cmd run verify
```

Workflow сверяет тег с версией, собирает проект, запускает тесты, проверяет
состав npm-архива и только затем выполняет публикацию в
`https://npm.pkg.github.com`.

Перед выпуском обновите версию в `package.json`, `package-lock.json` и команде
глобальной установки в README.
