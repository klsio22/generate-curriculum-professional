# Dependencies and Libraries

Below is the purpose of the main libraries used by the application.

## Runtime

- `react`: UI foundation.
- `react-dom`: DOM rendering.
- `react-hook-form`: high-performance form state handling.
- `react-i18next` and `i18next`: UI and PDF text internationalization.
- `@react-pdf/renderer`: PDF rendering and generation.
- `antd` (Ant Design 6): UI components (buttons, fields, dialogs, menus, alerts). Setup in `src/app/AntdProvider.tsx`; see `componentes.md`.
- `@ant-design/cssinjs`: `StyleProvider` that puts antd styles in a CSS cascade layer, so Tailwind utilities still apply on top.
- `lucide-react`: UI icons.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`: drag and drop to reorder resumes in the sidebar (mouse, touch and keyboard, with screen reader announcements).

## Build and Tooling

- `vite`: development server and build pipeline.
- `typescript`: static typing for the application.
- `eslint` and `typescript-eslint`: static analysis and code quality rules.
- `@vitejs/plugin-react`: React integration for Vite.
- `tailwindcss` and `@tailwindcss/vite`: utility-first styling, used for layout around the antd components.
- `globals`, `@types/react`, `@types/react-dom`, `@types/node`: environment and type support.

The build (`vite.config.ts`) splits vendor code into chunks: `react`, `pdf` (`@react-pdf/renderer`, heavy, which is why the chunk size warning limit is raised), `ui` and `antd`. Libraries change less often than the app code, so browsers keep those chunks cached between releases.

## Dependencies by Area

### Form

The form uses `react-hook-form` and `useFieldArray` to handle repeatable sections such as experience, education, and projects.

### PDF

PDF generation depends on `@react-pdf/renderer` and styles defined in `src/features/pdf/pdfStyles.ts`.

### Languages

The application registers language resources in `src/i18n/config.ts` and switches between Portuguese and English.

### Persistence

There is no external database or API dependency. State is stored in the browser through `localStorage`.

## Note

The `package.json` file should be considered the source of truth for exact versions and available scripts.