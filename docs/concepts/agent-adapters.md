# Agent Adapters

AgentSync хранит rules, skills и references в canonical registry и генерирует
нативные файлы для выбранного AI-агента. Один запуск sync обслуживает один
adapter, выбранный через --agent или первым значением agents в
.ai-skills.json.

## Поддерживаемые агенты

| Идентификатор | Rules | Skills | Диагностический index |
| --- | --- | --- | --- |
| codex | AGENTS.md, .agents/generated/rules/ | .agents/generated/skills/ | .agents/generated/skill-index.json |
| claude-code | .claude/rules/agentsync/*.md | .claude/skills/agentsync-<name>/SKILL.md | .agents/generated/claude-code/skill-index.json |
| cursor | .cursor/rules/agentsync-*.mdc | .cursor/skills/agentsync-<name>/SKILL.md | .agents/generated/cursor/skill-index.json |
| github-copilot | .github/instructions/agentsync-*.instructions.md | .github/skills/agentsync-<name>/SKILL.md | .agents/generated/github-copilot/skill-index.json |

Для Cursor bootstrap-файл имеет alwaysApply: true; category-файлы доступны
агенту по их description. Для GitHub Copilot generated instructions используют
applyTo: "**". Claude Code рекурсивно читает generated rules из
.claude/rules/agentsync/.

## Использование

~~~json
{
  "project": "statistics",
  "agents": ["codex", "claude-code", "cursor", "github-copilot"],
  "registry": "./registry"
}
~~~

~~~bash
ai-skills sync --agent claude-code
ai-skills sync --agent cursor
ai-skills sync --agent github-copilot
~~~

Сокращения claude и copilot принимаются при выборе агента и приводятся к
claude-code и github-copilot. В новых config и registry material следует
использовать канонические идентификаторы.

## Границы генерации

Adapter не перезаписывает пользовательские корневые точки входа:
CLAUDE.md и .github/copilot-instructions.md. Для Claude Code rules находятся
в выделенном каталоге .claude/rules/agentsync; для Cursor и GitHub Copilot
AgentSync владеет только файлами с префиксом agentsync. Пользовательские rules
и skills с другими именами не затрагиваются.

Повторный sync заменяет устаревшие AgentSync rules и skills, перечисленные в
предыдущем diagnostic skill-index.json.

Active rules определяются Composer в момент sync. После изменения project
context, технологий, task type или путей нужно выполнить sync повторно.
Skills и их bundled resources копируются в нативный каталог выбранного
агента и остаются on-demand.

## Applicability материалов

appliesTo.agents — явное семантическое ограничение. Для agent-neutral
materials поддерживаемые adapter-ы перечисляются явно:

~~~yaml
appliesTo:
  agents: ["codex", "claude-code", "cursor", "github-copilot"]
~~~

Не следует трактовать codex как неявный wildcard. Если material использует
специфичную возможность одного агента, его надо ограничить только
совместимыми идентификаторами.
