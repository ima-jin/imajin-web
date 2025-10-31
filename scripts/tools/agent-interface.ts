#!/usr/bin/env node
/**
 * Agent Interface CLI
 *
 * Simple interface to embody different doctor agents
 * Usage: npx tsx scripts/tools/agent-interface.ts
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import * as readline from 'readline';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  focus: string;
  filepath: string;
}

async function loadAgents(): Promise<AgentInfo[]> {
  const agentsDir = join(process.cwd(), 'docs/agents');
  const files = await readdir(agentsDir);
  const agents: AgentInfo[] = [];

  for (const file of files) {
    if (file.startsWith('DOCTOR_') && file.endsWith('.md')) {
      const filepath = join(agentsDir, file);
      const content = await readFile(filepath, 'utf-8');

      // Parse the first line for agent name
      const nameMatch = content.match(/^# (.+)$/m);
      const roleMatch = content.match(/\*\*Role:\*\* ([^|]+)/);
      const focusMatch = content.match(/\*\*Focus:\*\* (.+)$/m);

      if (nameMatch) {
        agents.push({
          id: file.replace('DOCTOR_', '').replace('.md', '').toLowerCase(),
          name: nameMatch[1].trim(),
          role: roleMatch ? roleMatch[1].trim() : 'Unknown',
          focus: focusMatch ? focusMatch[1].trim() : 'Unknown',
          filepath,
        });
      }
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

async function displayAgentSelection(agents: AgentInfo[]): Promise<void> {
  console.log('\n='.repeat(80));
  console.log('AGENT INTERFACE');
  console.log('='.repeat(80));
  console.log('\nYou are...\n');

  agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name}`);
    console.log(`     Role: ${agent.role}`);
    console.log(`     Focus: ${agent.focus}`);
    console.log();
  });

  console.log('  0. Exit\n');
}

async function getUserChoice(max: number): Promise<number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Select agent (0-' + max + '): ', (answer) => {
      rl.close();
      const choice = parseInt(answer, 10);
      if (isNaN(choice) || choice < 0 || choice > max) {
        console.log('Invalid choice. Please try again.\n');
        resolve(-1);
      } else {
        resolve(choice);
      }
    });
  });
}

async function displayAgentProfile(agent: AgentInfo): Promise<void> {
  const content = await readFile(agent.filepath, 'utf-8');

  console.log('\n' + '='.repeat(80));
  console.log(`YOU ARE NOW: ${agent.name.toUpperCase()}`);
  console.log('='.repeat(80));
  console.log('\n' + content);
  console.log('\n' + '='.repeat(80));
  console.log('Press Enter to return to agent selection...');
  console.log('='.repeat(80) + '\n');
}

async function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const agents = await loadAgents();

  if (agents.length === 0) {
    console.error('No agents found in docs/agents/');
    process.exit(1);
  }

  let running = true;

  while (running) {
    await displayAgentSelection(agents);
    const choice = await getUserChoice(agents.length);

    if (choice === -1) {
      continue;
    }

    if (choice === 0) {
      console.log('\nExiting agent interface.\n');
      running = false;
      break;
    }

    const selectedAgent = agents[choice - 1];
    await displayAgentProfile(selectedAgent);
    await waitForEnter();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
