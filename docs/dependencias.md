# Dependencies and Libraries

Below is the purpose of the main libraries used by the application.

## Runtime

- `react`: UI foundation.
- `react-dom`: DOM rendering.
- `react-hook-form`: high-performance form state handling.
- `react-i18next` and `i18next`: UI and PDF text internationalization.
- `@react-pdf/renderer`: PDF rendering and generation.
- `react-to-print`: browser print support/export flow integration.
- `lucide-react`: UI icons.

## Build and Tooling

- `vite`: development server and build pipeline.
- `typescript`: static typing for the application.
- `eslint` and `typescript-eslint`: static analysis and code quality rules.
- `@vitejs/plugin-react`: React integration for Vite.
- `tailwindcss` and `@tailwindcss/vite`: utility-first styling.
- `daisyui`: utility component layer on top of Tailwind.
- `globals`, `@types/react`, `@types/react-dom`, `@types/node`: environment and type support.

## Dependencies by Area

### Form

The form uses `react-hook-form` and `useFieldArray` to handle repeatable sections such as experience, education, and projects.

### PDF

PDF generation depends on `@react-pdf/renderer` and styles defined in `src/styles/pdfStyles.ts`.

### Languages

The application registers language resources in `src/i18n/config.ts` and switches between Portuguese and English.

### Persistence

There is no external database or API dependency. State is stored in the browser through `localStorage`.

## Note

The `package.json` file should be considered the source of truth for exact versions and available scripts.