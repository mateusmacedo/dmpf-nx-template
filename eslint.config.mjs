import nxEslintPlugin from '@nx/eslint-plugin';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  // Ignores globais
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
    ],
  },

  // Regras base TypeScript
  ...tsEslint.configs.recommended,

  // Regras Nx (module boundaries)
  {
    plugins: {
      '@nx': nxEslintPlugin,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            // Apps só podem depender de libs
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
            // E2E só pode depender do app que testa
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:app', 'type:lib'],
            },
            // Libs shared são agnósticas — só dependem de outras shared
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Backend só depende de backend ou shared
            {
              sourceTag: 'scope:backend',
              onlyDependOnLibsWithTags: ['scope:backend', 'scope:shared'],
            },
            // Frontend só depende de frontend ou shared
            {
              sourceTag: 'scope:frontend',
              onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared'],
            },
            // Isolamento de stacks: Angular não pode usar libs React/Next e vice-versa
            {
              sourceTag: 'stack:angular',
              onlyDependOnLibsWithTags: [
                'stack:angular',
                'stack:node',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'stack:next',
              onlyDependOnLibsWithTags: [
                'stack:next',
                'stack:node',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'stack:nest',
              onlyDependOnLibsWithTags: [
                'stack:nest',
                'stack:node',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'stack:express',
              onlyDependOnLibsWithTags: [
                'stack:express',
                'stack:node',
                'scope:shared',
              ],
            },
            {
              sourceTag: 'stack:fastify',
              onlyDependOnLibsWithTags: [
                'stack:fastify',
                'stack:node',
                'scope:shared',
              ],
            },
          ],
        },
      ],
    },
  },

  // Regras TypeScript específicas
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  }
);
