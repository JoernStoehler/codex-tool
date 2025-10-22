import { Command, Flags } from '@oclif/core';

import { apiPost } from '../../lib/api.js';

interface CounterResponse {
  value: number;
}

export default class CounterIncrement extends Command {
  static summary = 'Increment the counter and display the new value.';

  static description =
    'Sends a request to increment the counter via the Flock API. Set FLOCK_API_URL to override the default http://127.0.0.1:3000 base URL.';

  static flags = {
    json: Flags.boolean({
      description: 'Output JSON instead of human-readable text.',
      default: false
    })
  };

  async run(): Promise<void> {
    const {
      flags: { json }
    } = await this.parse(CounterIncrement);

    const payload = await apiPost<CounterResponse>('counter/increment');

    if (json) {
      this.log(JSON.stringify(payload));
      return;
    }

    this.log(`Counter value: ${payload.value}`);
  }
}
