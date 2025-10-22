import { Command, Flags } from '@oclif/core';

import { apiGet } from '../../lib/api.js';

interface CounterResponse {
  value: number;
}

export default class CounterShow extends Command {
  static summary = 'Show the current counter value.';

  static description =
    'Fetches the counter value from the Flock API. Set FLOCK_API_URL to override the default http://127.0.0.1:3000 base URL.';

  static flags = {
    json: Flags.boolean({
      description: 'Output JSON instead of human-readable text.',
      default: false
    })
  };

  async run(): Promise<void> {
    const {
      flags: { json }
    } = await this.parse(CounterShow);

    const payload = await apiGet<CounterResponse>('counter');

    if (json) {
      this.log(JSON.stringify(payload));
      return;
    }

    this.log(`Counter value: ${payload.value}`);
  }
}
