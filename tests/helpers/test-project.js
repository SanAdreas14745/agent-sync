const fs = require('node:fs');
const path = require('node:path');

function setupTestProject() {
  const projectRoot = path.resolve('./tests/.tmp/project');
  fs.rmSync(projectRoot, { recursive: true, force: true });
  fs.mkdirSync(projectRoot, { recursive: true });

  fs.writeFileSync(
    path.join(projectRoot, '.ai-skills.json'),
    JSON.stringify(
      {
        project: 'statistics',
        agents: ['codex'],
        technologies: ['typescript'],
        registry: path.resolve('./registry').replace(/\\/g, '/'),
      },
      null,
      2,
    ),
    'utf8',
  );

  return projectRoot;
}

module.exports = {
  setupTestProject,
};
