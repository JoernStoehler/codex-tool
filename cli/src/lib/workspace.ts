import { execa } from 'execa';
import process from 'node:process';

interface RunWorkspaceOptions {
  readonly workspace: string;
  readonly script: string;
  readonly args?: string[];
}

export async function runWorkspaceScript(options: RunWorkspaceOptions): Promise<void> {
  const { workspace, script, args = [] } = options;

  const commandArgs = ['run', script, '--workspace', workspace];

  if (args.length > 0) {
    commandArgs.push('--', ...args);
  }

  await execa('npm', commandArgs, {
    stdio: 'inherit',
    env: {
      ...process.env
    }
  });
}
