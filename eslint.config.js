import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';
import pluginPromise from 'eslint-plugin-promise';
import pluginJsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.vite/**',
      '**/node_modules/**',
      '**/*.d.ts',
      'coverage/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      import: pluginImport,
      promise: pluginPromise,
      jsdoc: pluginJsdoc
    },
    settings: {
      'import/resolver': {
        typescript: true
      }
    },
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          groups: [
            ['builtin', 'external'],
            ['internal'],
            ['parent', 'sibling', 'index']
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import/no-unresolved': 'error',
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off'
    }
  },
  prettier
);
