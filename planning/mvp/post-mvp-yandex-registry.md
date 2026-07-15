# Post-MVP: npm-пакет и registry в Yandex Object Storage

Статус: planning-документ.

Этот документ фиксирует post-MVP направление и рабочие ограничения. Он не
является финальной пользовательской инструкцией.

## Решение

После проверки MVP на файловом registry целевая модель распространения:

``` text
@company/ai-skills npm package
  CLI
  Composer
  Adapters
  Validators

Yandex Object Storage
  centralized registry
  skills
  references
  index.json
  releases / versions
```

CLI распространяется как npm-пакет, а registry со скиллами хранится
отдельно в Yandex Object Storage. Это позволяет обновлять правила без
перевыпуска npm-пакета.

## Почему это выбранное направление

-   CLI можно установить один раз и запускать как `ai-skills`.
-   Скиллы обновляются централизованно в Object Storage.
-   Изменения правил не требуют новой версии npm-пакета.
-   Можно настроить read/write доступы через Yandex Cloud IAM.
-   Можно использовать versioning bucket-а и releases.
-   Можно добавить локальный cache для offline/read fallback.
-   Не нужен полноценный backend на первом cloud-этапе.

## Важное ограничение

Yandex Object Storage является object storage, а не базой данных и не
workflow engine.

Он хорошо подходит для:

-   Markdown-файлов скиллов;
-   reference-документов;
-   `index.json`;
-   manifest/release files;
-   версионирования объектов;
-   read-only sync.

Для возможностей ниже позже может потребоваться backend или Web UI:

-   review workflow;
-   approval;
-   комментарии;
-   блокировки редактирования;
-   права на уровне отдельных скиллов;
-   audit UI;
-   аналитика использования.

## Registry Material Reviewer

После MVP нужно добавить проверку вносимых registry materials перед
публикацией.

Проблема: authoring-интерфейс не должен требовать ручных numeric
priority/order. Порядок применения определяется Composer-ом по scope,
severity, category и id. Если два правила одного уровня конфликтуют, это
ошибка качества registry, а не задача сортировки.

Нужно отдельно проработать форму reviewer-а:

-   отдельная CLI-команда, например `ai-skills registry review`;
-   встроенный агентный reviewer;
-   on-demand skill для review registry materials;
-   комбинация lint-проверок и агентного review.

Reviewer должен проверять как минимум:

-   конфликтующие правила одного scope/category;
-   слишком широкие правила, которые нужно сузить по project, technology
    или path;
-   материалы, ошибочно оформленные как rule вместо skill/reference;
-   дублирующиеся или пересекающиеся формулировки;
-   references, которые случайно попадают в active context;
-   отсутствие нужных ссылок из skill на bundled resources.

## OpenSpec / Open Spec Research

Одним из ближайших post-MVP research-этапов нужно посмотреть на концепцию
OpenSpec / open spec и понять, может ли AgentSync адаптироваться под этот
стандарт.

Причина: рабочие проекты могут в скором времени перейти на этот формат, и
нужно заранее оценить, как это повлияет на registry materials, generated
agent context, provider model и rollout.

Вопросы исследования:

-   что именно называется OpenSpec / open spec в целевом контексте и какие
    форматы/инструменты входят в стандарт;
-   можно ли представить текущие rules, skills и references через этот
    формат без потери semantics;
-   нужен ли отдельный provider, converter или adapter;
-   какие изменения потребуются в `.ai-skills.json`, index files и release
    model;
-   можно ли сохранить файловый registry как baseline и добавить OpenSpec
    compatibility layer без ломки MVP-сценария.

Результатом исследования должен быть короткий planning-документ с выводом:
адаптироваться сейчас, отложить до появления рабочих проектов на этом
формате или не поддерживать стандарт.

## Предлагаемая структура bucket-а

``` text
ai-skills-registry/
  registries/
    frontend/
      v1/
        index.json
        skills/
          company/common.md
          projects/omega/typescript.md
        references/
          omega/architecture.md
        releases/
          current.json
          2026-07-07T120000Z.json
```

## index.json

Пример:

``` json
{
  "version": 1,
  "updatedAt": "2026-07-07T12:00:00.000Z",
  "skills": [
    {
      "id": "project.omega.typescript",
      "version": 1,
      "file": "skills/projects/omega/typescript.md",
      "checksum": "..."
    }
  ]
}
```

## Конфиг проекта

В будущем `.ai-skills.json` должен поддерживать не только string-path, но
и object config:

``` json
{
  "project": "omega",
  "agents": ["codex"],
  "technologies": ["typescript", "angular", "nestjs"],
  "registry": {
    "type": "yandex-object-storage",
    "bucket": "ai-skills-registry",
    "prefix": "registries/frontend/v1",
    "endpoint": "https://storage.yandexcloud.net"
  }
}
```

Секреты доступа нельзя хранить в `.ai-skills.json`. Их нужно брать из:

-   environment variables;
-   `~/.ai-skills/config.json`;
-   Yandex Cloud profile;
-   service account credentials.

## Архитектурное изменение

Нужно добавить слой provider-ов:

``` ts
interface RegistryProvider {
  readRegistry(): Promise<ReadRegistryResult>;
}
```

Реализации:

``` text
FileRegistryProvider
YandexObjectStorageRegistryProvider
```

Текущий файловый registry остается baseline и fallback. Cloud registry не
должен ломать текущий MVP-сценарий.

## Рекомендуемый порядок реализации

1.  Подготовить AgentSync как npm-пакет.
2.  Проверить локальную установку через `npm install -g .`.
3.  Добавить `ai-skills --version`, чтобы разработчики могли быстро
    проверить установленную версию CLI.
4.  Добавить `RegistryProvider` abstraction.
5.  Поддержать `registry` как object config, а не только string-path.
6.  Добавить локальный cache:

    ``` text
    ~/.ai-skills/cache/
    ```

7.  Добавить read-only загрузку registry из Yandex Object Storage.
8.  Добавить команды диагностики cloud registry.
9.  После стабилизации read-only flow добавить write/publish commands.

## Возможные команды после MVP

``` bash
ai-skills registry pull
ai-skills registry status
ai-skills registry publish
ai-skills registry push
```

Первым cloud-шагом должен быть read-only sync. Write/publish flow нужно
добавлять позже, когда будут понятны правила доступа и согласования.

## Итог

Выбранное направление:

``` text
npm-пакет = глобально установленный CLI-инструмент
Yandex Object Storage = живой centralized registry правил
file registry = baseline, локальный fallback и тестовая основа
```

Для первого rollout используется глобальная установка:

``` bash
npm install -g @ai-tools/ai-skills
```

Установка как `devDependency` в каждый проект не является основным
сценарием. Ее можно рассмотреть позже для проектов, где нужно жестко
зафиксировать версию CLI в `package-lock.json` или запускать AgentSync в
CI.
