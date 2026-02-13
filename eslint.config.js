import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'demo/'] },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
);
