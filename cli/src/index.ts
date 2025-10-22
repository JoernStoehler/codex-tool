import { flush, run } from '@oclif/core';

export { run };

async function main(): Promise<void> {
  try {
    await run();
    await flush();
  } catch (error) {
    await flush(error as Error);
    process.exitCode = 1;
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    } else {
      console.error(error);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
