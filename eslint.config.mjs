import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error', // or "error"
      {
        // args: 'all',
        argsIgnorePattern: '^_',
        // caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        // destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // ignoreRestSiblings: true,
      },
    ],
    'no-unused-vars': 'off',
  },
});
