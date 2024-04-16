import eslint from '@eslint/js';
import tseslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
        "no-unused-vars": "warn"
    },
    files: [
      "src/**/*"
    ],
    ignores: [
      "/tests/**",
      "**/*.d.ts"
    ]
  }
];