# Pilot Checklist

Status: planning document.

This checklist is a working aid for running the AgentSync MVP pilot. It is
not final product documentation.

Use this checklist when trying AgentSync MVP on a real frontend
repository.

## 1. Select Repository

Choose one repository that:

- has active frontend development;
- has known project rules or existing local AI instructions;
- is not the riskiest legacy repository;
- has at least one developer ready to provide feedback.

## 2. Prepare Registry Rules

Create or adapt initial skills:

``` text
company.common
frontend.common
frontend.code-review
project.<project>.api
```

For every skill, check:

- `id`;
- `title`;
- `summary`;
- `scope`;
- `loadMode`;
- `status`;
- `version`;
- `owner`;
- `updatedAt`;
- `appliesTo`.

## 3. Add Project Config

Add `.ai-skills.json` to the target repository:

``` json
{
  "project": "statistics",
  "agents": ["codex"],
  "technologies": ["typescript"],
  "registry": "../agent-sync-registry"
}
```

Adjust `project`, `technologies` and `registry` for the target
repository. Codex defaults to `AGENTS.md` and `.agents/generated/`.

## 4. Decide Git Policy

Recommended for pilot:

``` text
.agents/generated/
```

in `.gitignore`.

Decide separately whether `AGENTS.md` should be committed. For pilot, it
is acceptable to keep it generated locally until the team agrees on a
policy.

## 5. Run Checks

From AgentSync repository:

``` powershell
node .\dist\cli.js check --project-root <path-to-target-repository>
```

Expected:

``` text
OK    project config found
OK    project config is valid
OK    registry found
OK    registry items loaded
OK    output paths are safe
```

## 6. Generate Files

Preview:

``` powershell
node .\dist\cli.js sync --project-root <path-to-target-repository> --task-type code-review --dry-run
```

Generate:

``` powershell
node .\dist\cli.js sync --project-root <path-to-target-repository> --task-type code-review
```

Inspect:

``` powershell
node .\dist\cli.js status --project-root <path-to-target-repository>
```

## 7. Explain Skill Selection

Check at least one included and one skipped skill:

``` powershell
node .\dist\cli.js info frontend.code-review --project-root <path-to-target-repository> --task-type code-review
```

``` powershell
node .\dist\cli.js info frontend.code-review --project-root <path-to-target-repository>
```

## 8. Review Generated Output

Inspect:

``` text
AGENTS.md
.agents/generated/active-rules.md
.agents/generated/skill-index.json
```

Check:

- `AGENTS.md` is short;
- active rules are relevant;
- reference materials are in `skill-index.json`, not in active context;
- manifest lists expected `id@version`;
- warnings are understandable.

## 9. Try With Codex

Open the target repository with generated files and ask Codex to perform
a realistic task.

Observe:

- whether Codex follows active rules;
- whether rules are too verbose;
- whether important project-specific instructions are missing;
- whether task-specific rules should be split further.

## 10. Collect Feedback

Record answers:

- Which rules helped?
- Which rules were ignored?
- Which rules were missing?
- Which rules were too broad?
- Is `info` explanation clear?
- Is frontmatter easy enough to maintain?
- Should `AGENTS.md` be committed?
- What should be added before a second repository pilot?

## Exit Criteria

Pilot is successful if:

- target repository can run `check` without errors;
- `sync` generates Codex files;
- generated active rules are short enough to inspect;
- Codex can use the generated instructions in a real task;
- team can identify concrete changes for the next iteration.
