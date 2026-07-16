import { createNativeAgentAdapter } from './native';

export const githubCopilotAdapter = createNativeAgentAdapter({
  id: 'github-copilot',
  displayName: 'GitHub Copilot',
  output: {
    rulesDir: '.github/instructions',
    skillsDir: '.github/skills',
    skillIndexPath: '.agents/generated/github-copilot/skill-index.json',
    ruleFormat: 'github-copilot',
  },
});
