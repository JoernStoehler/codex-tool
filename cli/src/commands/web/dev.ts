import { Command } from '@oclif/core';

import { runWorkspaceScript } from '../../lib/workspace.js';

export default class WebDev extends Command {
  static summary = 'Launch the Flock web console in development mode.';

  static description =
    'Runs `npm run dev --workspace web`, forwarding any additional arguments to the Vite dev server.';

  static examples = ['<%= config.bin %> web dev', '<%= config.bin %> web dev -- --host 0.0.0.0'];

  static strict = false;

  async run(): Promise<void> {
    await runWorkspaceScript({
      workspace: 'web',
      script: 'dev',
      args: this.argv as string[]
    });
  }
}
