import { Command } from '@oclif/core';
import chalk from 'chalk';

export default class FlockCommand extends Command {
  static summary =
    'Interact with the Flock platform to manage agent orchestrations, tasks, and environments.';

  static description = `Use subcommands such as ${chalk.cyan(
    'flock api dev'
  )} or ${chalk.cyan('flock web dev')} to launch specific surfaces.`;

  async run(): Promise<void> {
    this.log(
      [
        chalk.bold('Flock CLI'),
        '',
        'Coordinate Codex agents and human collaborators through ergonomic commands.',
        '',
        `Try ${chalk.cyan('flock api dev')} to boot the API server.`,
        `Try ${chalk.cyan('flock web dev')} to run the web console.`,
        '',
        `Run ${chalk.cyan('flock help')} for a full command list.`
      ].join('\n')
    );
  }
}
