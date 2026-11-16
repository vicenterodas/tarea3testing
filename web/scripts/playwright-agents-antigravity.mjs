// Adapta los agentes de Playwright (planner, generator, healer) a Antigravity.
//
// Playwright todavía no tiene `--loop=antigravity`, así que este script:
//   1. Ejecuta `npx playwright init-agents --loop=claude` (conserva tests/seed.spec.ts, crea
//      specs/ y las definiciones de agentes en .claude/agents/).
//   2. Convierte cada agente en una skill de Antigravity: .agents/skills/<nombre>/SKILL.md
//   3. Registra el servidor MCP de Playwright en .agents/mcp_config.json
//   4. Borra los archivos propios de Claude Code (.claude/agents y .mcp.json).
//
// Uso (desde la carpeta web/):  node scripts/playwright-agents-antigravity.mjs
// Vuelva a ejecutarlo cada vez que actualice Playwright.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

execSync('npx playwright init-agents --loop=claude', { stdio: 'inherit' });

const agentsDir = path.join('.claude', 'agents');
for (const file of fs.readdirSync(agentsDir).filter((f) => f.startsWith('playwright-test-'))) {
  const source = fs.readFileSync(path.join(agentsDir, file), 'utf8').replace(/\r\n/g, '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Formato inesperado en ${file}`);
  const [, frontmatter, body] = match;
  const field = (key) => frontmatter.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1] ?? '';
  const name = field('name');

  const skillDir = path.join('.agents', 'skills', name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${field('description')}\n---\n\n` +
      'Usa las herramientas del servidor MCP `playwright-test` ' +
      '(por ejemplo `planner_setup_page`, `browser_snapshot`, `generator_write_test`, `test_run`).\n' +
      body,
  );
  console.log(` 🧩 ${skillDir}${path.sep}SKILL.md`);
}

const mcpServer =
  process.platform === 'win32'
    ? { command: 'cmd', args: ['/c', 'npx', 'playwright', 'run-test-mcp-server'] }
    : { command: 'npx', args: ['playwright', 'run-test-mcp-server'] };
fs.mkdirSync('.agents', { recursive: true });
fs.writeFileSync(
  path.join('.agents', 'mcp_config.json'),
  JSON.stringify({ mcpServers: { 'playwright-test': { ...mcpServer, cwd: process.cwd() } } }, null, 2) + '\n',
);
console.log(` 🔧 .agents${path.sep}mcp_config.json`);

fs.rmSync(agentsDir, { recursive: true, force: true });
if (fs.readdirSync('.claude').length === 0) fs.rmSync('.claude', { recursive: true });
fs.rmSync('.mcp.json', { force: true });
console.log(' ✅ Agentes de Playwright listos para Antigravity.');
