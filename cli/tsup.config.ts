import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  splitting: false,
  format: ['esm'],
  target: 'node22',
  dts: false,
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node'
  }
});
