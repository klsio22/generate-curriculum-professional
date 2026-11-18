# Components

This document describes the responsibility of each component and core module.

## UI library: Ant Design

Screens are built with [Ant Design 6](https://ant.design/components/overview) (`antd`): `Button`, `Input`, `Select`, `AutoComplete`, `Checkbox`, `Form.Item`, `Modal`, `Drawer`, `Dropdown`, `Alert`, `Tag`, `Steps`, `Table`, `Collapse`, `Descriptions`, `Segmented`, `Card`, plus `App.useApp()` for `message`, `notification` and `modal.confirm`. Tailwind is kept for layout (grids, spacing, the header, the PDF preview area).

- **Setup** (`src/app/AntdProvider.tsx`): theme with the app's indigo as primary color, darker on hover so buttons stay crisp; antd locale follows the i18n language (pt-BR / en); `StyleProvider layer` puts antd styles in `@layer antd`, and `src/styles/index.css` orders the layers `theme, base, antd, components, utilities`, so Tailwind utility classes can still adjust antd components.
- **Rule**: raw `<button>`, `<input>`, `<select>`, `<textarea>` and `<label>` are not allowed in `src/app`, `src/features` (except `pdf`) and `src/shared` (`no-restricted-syntax` in `eslint.config.js`). The only exception is the hidden file picker of the backup menu, with a comment.
- **Labels**: fields use `Form.Item label` + `htmlFor`, inside `<Form layout="vertical" component={false}>` when there is no real form.
- **Keyboard**: antd `Modal` and `Drawer` keep focus inside, close on Escape and return focus. For `Dropdown` menus, `useFocusReturn` gives focus back to the menu button after Escape.

Files are grouped by feature:

| Folder | Files |
|---|---|
| `src/app/` | `App.tsx`, `AppHeader.tsx`, `AntdProvider.tsx` |
| `src/features/cv-editor/` | `CVForm.tsx`, `Sidebar.tsx`, `useCVStorage.ts`, `defaultCV.ts`, `components/FormField.tsx`, `components/FormSection.tsx`, `components/RepeatableList.tsx` |
| `src/features/pdf/` | `CVDocument.tsx`, `PDFPreview.tsx`, `pdfMetadata.ts`, `pdfStyles.ts`, `textUtils.ts` |
| `src/features/backup/` | `backup.ts`, `BackupMenu.tsx`, `RestoreBackupModal.tsx` |
| `src/features/ai/` | `client.ts`, `providers.ts`, `prompts.ts`, `parse.ts`, `jobTailoring.ts`, `keywords.ts`, `useAISettings.ts`, `AISettingsDrawer.tsx`, `ModelCombobox.tsx`, `TailorJobModal.tsx`, `TailorResultView.tsx` |
| `src/shared/components/` | `StatusAlert.tsx`, `LanguageSelector.tsx`, `useFocusReturn.ts` |
| `src/types/` | `cv.ts` (resume data types) |

## App.tsx

Root UI component.

Responsibilities:

- load resume state through `useCVStorage`
- control the active resume
- open and close the sidebar on small screens
- ask for confirmation before delete and clear (`modal.confirm`)
- save and restore backups (with the restore confirmation)
- hold the AI settings and open the AI dialogs
- show success notices (`message`, close by themselves) and errors (`notification`, stay until closed)
- connect the form to preview and PDF rendering
- coordinate export with `PDFDownloadLink` and `react-to-print`

## AppHeader.tsx

Header component used by the application shell (antd `Button`, `Badge`).

Responsibilities:

- render the title and language selector
- expose "Tailor to a job" and "AI settings" (with a dot when AI is configured)
- render the Backup menu
- expose the PDF download action, with the file name from `pdfMetadata.ts`
- same actions on desktop and mobile
- keep the top bar logic out of `App.tsx`

## CVForm.tsx

Main resume editing form, described by lists of fields (`PERSONAL`, `EXPERIENCE`, `EDUCATION`, `PROJECTS`, `REFERENCES`, `TEXT_SECTIONS`) instead of one block of markup per field.

Responsibilities:

- edit personal data, objective, skills, languages, soft skills and interpersonal competencies
- add and remove repeatable blocks for experience, education, projects and references
- save on blur, and after adding or removing an item

Building blocks (`src/features/cv-editor/components/`):

- `FormField`: label + antd `Input` / `Input.TextArea` (grows with the text), bound to react-hook-form with a `Controller` (antd inputs do not expose the native element the way `register` expects). Saves on blur. `hideLabel` keeps the label for screen readers when the section title already names the field; `secondary` is the smaller label of "name shown for this link".
- `FormSection`: section title.
- `RepeatableList`: one `Card` per item ("Experience 1", "Experience 2"...) with a remove button that says what it removes, and a dashed "Add" button.

## CVDocument.tsx

PDF representation of the resume.

Responsibilities:

- convert `CVData` into an export-ready document
- render conditional sections based on filled data
- format external links and multi-line text blocks
- apply PDF styles from `pdfStyles.ts`

## PDFPreview.tsx

PDF preview container.

Responsibilities:

- render the document inside `PDFViewer`
- display the resume in a layout similar to final output
- provide the central preview area on the right column

## Sidebar.tsx

Side panel for resume management: an antd `Drawer` from the left, with the dark theme (`theme.darkAlgorithm` in a nested `ConfigProvider`).

Responsibilities:

- list saved resumes in the user's order, select the active one, create a new one
- reorder: drag by the handle on desktop (`@dnd-kit`, also with the keyboard: Space, arrows, Space; Escape cancels; moves are announced to screen readers), or "Move up" / "Move down" in the ⋯ menu on any screen size (on small screens the handle is hidden and the menu is the way to move)
- ⋯ menu per resume (antd `Dropdown`): rename (inline field: Enter or leaving saves, Escape cancels), duplicate, move up, move down, delete; Escape returns focus to the ⋯ button
- AI-tailored resumes show a ✨ icon, the job as title and the company on the line below
- "Delete all resumes" is a small link in the footer, with confirmation
- all texts come from i18n (`sidebar.*`); the open button stays on the page, so focus returns to it when the panel closes

Reordering uses `moveCV(id, toIndex)` from `useCVStorage` (action `MOVE`, tested in `useCVStorage.test.ts`); it does not change `updatedAt`. Each list item has separate buttons (handle, select, menu), with no button inside another.

## StatusAlert.tsx

Result of an action as an antd `Alert` (`success`, `error`, `info`, `busy` with a spinner). An optional `detail` (technical text, such as the provider's message) stays under a collapsed "Technical details". Put it inside a `role="status"` or `role="alert"` region so it is announced.

## useFocusReturn.ts

For antd `Dropdown`: when the menu closes and focus was lost (on `<body>` or still on an item of the closing menu, e.g. after Escape), focus goes back to the button that opened it. When an action moved focus somewhere on purpose (a rename field, a dialog), it is left alone.

## BackupMenu.tsx / RestoreBackupModal.tsx

See `import-export-json.md`. The menu (antd `Dropdown`) explains backups in plain words; the modal (antd `Modal`) shows the file's content and offers "Add to my resumes" (focused first) or "Replace everything".

## AISettingsDrawer.tsx / ModelCombobox.tsx / TailorJobModal.tsx / TailorResultView.tsx

See `ia-adaptacao-vaga.md`. Settings: provider, key, model, connection test, forget key. The settings open in an antd `Drawer` from the right; when opened from "Tailor to a job", closing or saving goes back there. The key field keeps its own show/hide button (`aria-pressed`) because the eye icon of `Input.Password` cannot be reached with the keyboard. `ModelCombobox` is an antd `AutoComplete`: options grouped by company, rich rows drawn with `optionRender` (the field itself shows the plain id), filtering done in code by name, id and company, Enter picks the first match, Escape closes only the list. Tailoring (antd `Modal`): `Steps` for job → analysis → result, `Descriptions`, keyword `Tag`s, coverage `Table` and before/after `Collapse`.

## LanguageSelector.tsx

UI language switcher (antd `Segmented`, PT / EN).

Responsibilities:

- switch between `pt-BR` and `en`
- persist selection in `localStorage`
- reflect current language state in the UI

## useCVStorage.ts

Persistence and resume CRUD hook.

Responsibilities:

- load initial data from `localStorage`
- create resumes from default seed data
- duplicate existing resumes
- update resume content
- delete resumes
- clear everything and rebuild initial state
- import a restored list of resumes and update the active resume

## defaultCV.ts

Initial data used as a base for new resumes.

Responsibilities:

- provide a complete prefilled example
- act as fallback when no saved data exists

## pdfStyles.ts

Dedicated PDF styles.

Responsibilities:

- define typography, spacing, and visual hierarchy in the document
- keep PDF layout separate from web UI CSS

## textUtils.ts

Text helpers used mainly in PDF rendering.

Responsibilities:

- normalize date strings
- normalize URLs before creating clickable links
- apply simple wrapping/truncation for long text