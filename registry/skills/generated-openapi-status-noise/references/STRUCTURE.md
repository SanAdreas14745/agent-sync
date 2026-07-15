# Generated OpenAPI Status Noise Diagnostics

Этот reference описывает подробный порядок диагностики, когда после генерации
OpenAPI frontend files `git status` показывает массовые изменения.

## Симптом

После автогенерации `git status` показывает сотни изменённых DTO/API-файлов,
хотя задача затрагивала только один раздел.

## Диагностика

Сначала отдели `status` от реального diff:

``` bash
git status --short -- path/to/generated
git diff --name-only -- path/to/generated
git diff --raw -- path/to/generated
```

Если `status` показывает сотни файлов, а `diff` или `raw` видит единицы, это
не массовое содержательное изменение.

Проверь конкретный лишний файл:

``` bash
git diff -- path/to/generated/model/someUnrelatedDto.ts
git diff --quiet -- path/to/generated/model/someUnrelatedDto.ts
git status --porcelain=v2 -- path/to/generated/model/someUnrelatedDto.ts
```

Если `diff` пустой, а index/worktree hash совпадает, файл stat-dirty после
перезаписи генератором.

Проверь EOL и attributes:

``` bash
git ls-files --eol -- path/to/generated/model/someUnrelatedDto.ts
git config --get core.autocrlf
git check-attr -a -- path/to/generated/model/someUnrelatedDto.ts
```

LF/CRLF может быть сопутствующим фактором, но не считай его причиной без
подтверждения diff-ом, raw status и attributes.

## Очистка Шума

Обнови index metadata без отката содержимого:

``` bash
git update-index --really-refresh -- path/to/file
```

На Windows не передавай тысячи файлов одной командой из-за лимита длины
аргументов. Делай refresh чанками.

После refresh снова проверь:

``` bash
git status --short -- path/to/generated
git diff --name-only -- path/to/generated
```

## Правило Принятия Решения

- Если файл есть в `status`, но отсутствует в `git diff --name-only`, это не
  содержательное изменение.
- Если файл есть в `git diff`, смотри diff вручную.
- Лишние реальные изменения из чужих разделов не тащи в задачу, даже если они
  пришли от генератора.
- Новые DTO/API по текущему Swagger/OpenAPI contract оставляй, если они
  относятся к задаче.
