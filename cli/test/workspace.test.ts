import { describe, expect, it, vi } from 'vitest';

const execaMock = vi.fn(async () => Promise.resolve());

vi.mock('execa', () => ({
  execa: execaMock
}));

describe('runWorkspaceScript', () => {
  it('invokes npm workspace script with forwarded args', async () => {
    const { runWorkspaceScript } = await import('../src/lib/workspace.js');

    await runWorkspaceScript({
      workspace: 'api',
      script: 'dev',
      args: ['--inspect']
    });

    expect(execaMock).toHaveBeenCalledWith(
      'npm',
      ['run', 'dev', '--workspace', 'api', '--', '--inspect'],
      expect.objectContaining({
        stdio: 'inherit'
      })
    );
  });
});
