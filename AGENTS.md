# AgentSync Local Instructions

This repository has local agent instructions in addition to canonical
registry materials.

## Read First

Before running commands or editing files in this repository, read local
project rules:

- [agentsync-rules/windows-npm-commands.md](agentsync-rules/windows-npm-commands.md)

## Local Skills

Use local skills from `agentsync-skills/` when the task matches their
description:

- `agentsync-documentation` - documentation and planning material changes.
- `agentsync-registry-material-validation` - registry material structure and validation.
- `agentsync-skill-creating` - creating or updating AgentSync skills.

Open only the relevant `SKILL.md` and referenced files needed for the current
task.

## Registry Boundary

- Canonical shareable registry lives in the separate `harness-system/agent-sync-registry` repository.
- `registry/` is a local test fixture and is not included in the npm package.
- `agentsync-rules/` and `agentsync-skills/` are local instructions for working
  in this AgentSync repository.
- Do not move local-only rules into `registry/` unless they should be shared
  with generated agent contexts.
