# Generated OpenAPI Status Noise Examples

## Status Noise

`git status --short -- generated/api` показывает сотни `M` files, но:

``` bash
git diff --name-only -- generated/api
git diff --raw -- generated/api
```

возвращают только несколько файлов или пустой список.

Решение: проверить один лишний файл, затем обновить index metadata через
`git update-index --really-refresh` для affected generated files.

## Реальное Изменение

`git status --short -- generated/api` и `git diff --name-only -- generated/api`
показывают один и тот же DTO или API file.

Решение: открыть diff вручную и решить, относится ли изменение к текущему
Swagger/OpenAPI contract и задаче.

## LF/CRLF Гипотеза

`git ls-files --eol` показывает различия между index и worktree.

Решение: проверить `.gitattributes`, `core.autocrlf` и реальный diff. Не
объявляй EOL причиной, если `git diff --raw` и атрибуты это не подтверждают.
