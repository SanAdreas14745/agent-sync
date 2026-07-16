import { createNativeAgentAdapter } from './native';

export const claudeCodeAdapter = createNativeAgentAdapter({
  id: 'claude-code',
  displayName: 'Claude Code',
  output: {
    rulesDir: '.claude/rules/agentsync',
    skillsDir: '.claude/skills',
    skillIndexPath: '.agents/generated/claude-code/skill-index.json',
    ruleFormat: 'claude',
  },
});
