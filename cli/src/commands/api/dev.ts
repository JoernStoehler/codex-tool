import { Command } from '@oclif/core';

import { runWorkspaceScript } from '../../lib/workspace.js';

export default class ApiDev extends Command {
  static summary = 'Start the Flock API development server.';

  static description =
    'Runs `npm run dev --workspace api`, forwarding any additional arguments to the underlying script.';

  static examples = ['<%= config.bin %> api dev', '<%= config.bin %> api dev -- --watch'];

  static strict = false;

  async run(): Promise<void> {
    await runWorkspaceScript({
      workspace: 'api',
      script: 'dev',
      args: this.argv as string[]
    });
  }
}
