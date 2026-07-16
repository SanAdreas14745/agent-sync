import { createNativeAgentAdapter } from './native';

export const cursorAdapter = createNativeAgentAdapter({
  id: 'cursor',
  displayName: 'Cursor',
  output: {
    rulesDir: '.cursor/rules',
    skillsDir: '.cursor/skills',
    skillIndexPath: '.agents/generated/cursor/skill-index.json',
    ruleFormat: 'cursor',
  },
});
