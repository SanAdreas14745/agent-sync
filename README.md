# AgentSync

AgentSync — инструмент для централизованного управления AI-скиллами и
правилами разработки.

Разработчик запускает CLI в проекте, а AgentSync выбирает правила из
централизованного registry и генерирует инструкции в формат конкретного
AI-агента.

AgentSync распространяется как внутренний npm-пакет через GitHub Packages.
Пакет содержит только CLI и adapters. Canonical registry хранится в отдельном
Git-репозитории, а его версия фиксируется в проекте-потребителе, поэтому
обновление rules/skills не требует выпуска новой версии CLI.

## Требования

- Node.js 20 или новее;
- доступ на чтение пакетов namespace `@harness-system` в GitHub Packages;
- classic personal access token GitHub с разрешением `read:packages` для
  установки внутреннего пакета.

## Быстрый старт

Для установки потребуется GitHub personal access token с доступом к GitHub
Packages и приватному репозиторию `harness-system/agent-sync-registry`.

### 1. Создать личный токен GitHub

1. Откройте [страницу создания токена](https://github.com/settings/tokens/new?scopes=read%3Apackages&description=AgentSync%20package%20install).
2. Нажмите **Generate new token**.
3. Выдайте токену доступ к чтению GitHub Packages и registry-репозитория.
4. Скопируйте значение токена: GitHub покажет его только один раз.

### 2. Настроить npm на компьютере

Создайте или обновите пользовательский файл `.npmrc`:

- Windows: `C:\Users\<user>\.npmrc`;
- macOS: `~/.npmrc` или `/Users/<user>/.npmrc`.

Добавьте в него:

```text
@harness-system:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=ВСТАВЬТЕ_СЮДА_СВОЙ_ТОКЕН
```

Этот файл находится вне проекта. Не добавляйте токен в `.npmrc` репозитория и
не коммитьте его.

### 3. Установить AgentSync глобально

Windows (PowerShell):

```powershell
npm.cmd install --global @harness-system/pb-agent-sync@2.0.1
ai-skills --version
```

macOS:

```shell
npm install --global @harness-system/pb-agent-sync@2.0.1
ai-skills --version
```

### 4. Добавить `.ai-skills.json` в проект-потребитель

В корне проекта создайте `.ai-skills.json`:

```json
{
  "project": "omega",
  "agents": ["cursor"],
  "technologies": ["typescript", "angular", "nestjs"],
  "registry": {
    "type": "git",
    "url": "https://github.com/harness-system/agent-sync-registry",
    "ref": "main"
  }
}
```

Замените:

- `project` — именем проекта: `omega`, `brandapp` или `storybook`;
- `agents` — используемыми агентами: `claude-code`, `cursor`, `codex` или
  `github-copilot`;
- `technologies` — технологиями проекта.

### 5. Сгенерировать rules и skills

Перейдите в корень проекта-потребителя и выполните:

```shell
ai-skills update --project-root .
```

При первом обращении Git может запросить доступ к
`harness-system/agent-sync-registry`; используйте тот же GitHub token через
стандартный Git credential manager. `update` создаст `.ai-skills.lock.json` с
полным commit SHA и сгенерирует инструкции.

Ожидаемый результат: в корне проекта появятся `AGENTS.md` и каталог `.agents/`
с rules и skills, соответствующими выбранному агенту, проекту и стеку.

## Подробнее

Быстрого старта достаточно для обычного использования AgentSync. Технические
сценарии и сведения для maintainers вынесены в отдельные документы:

- [Команды CLI](./docs/guides/cli-commands.md) — `sync`, `update`, диагностика
  и проверка registry;
- [Registry и его поставка](./docs/guides/registry.md) — устройство материалов,
  Git registry и lock-файл;
- [Публикация внутреннего пакета](./docs/guides/package-release.md) — выпуск в
  GitHub Packages;
- [Локальная разработка AgentSync](./docs/guides/local-development.md) — сборка,
  тесты и smoke-проверки исходников.
