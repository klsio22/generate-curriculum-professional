import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['src/app/**/*.tsx', 'src/features/**/*.tsx', 'src/shared/**/*.tsx'],
    ignores: ['src/features/pdf/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...['button', 'input', 'select', 'textarea', 'label'].map((element) => ({
          selector: `JSXOpeningElement[name.name='${element}']`,
          message: `Use the Ant Design component instead of <${element}> (see docs/componentes.md).`,
        })),
      ],
    },
  },
])
