# Components

This document describes the responsibility of each component and core module. Files are grouped by feature:

| Folder | Files |
|---|---|
| `src/app/` | `App.tsx`, `AppHeader.tsx` |
| `src/features/cv-editor/` | `CVForm.tsx`, `Sidebar.tsx`, `useCVStorage.ts`, `defaultCV.ts` |
| `src/features/pdf/` | `CVDocument.tsx`, `PDFPreview.tsx`, `pdfMetadata.ts`, `pdfStyles.ts`, `textUtils.ts` |
| `src/features/backup/` | `backup.ts`, `BackupMenu.tsx`, `RestoreBackupModal.tsx` |
| `src/features/ai/` | `client.ts`, `providers.ts`, `prompts.ts`, `parse.ts`, `jobTailoring.ts`, `keywords.ts`, `useAISettings.ts`, `AISettingsDrawer.tsx`, `ModelCombobox.tsx`, `TailorJobModal.tsx`, `TailorResultView.tsx` |
| `src/shared/components/` | `Modal.tsx`, `Drawer.tsx`, `ActionMenu.tsx`, `useDialogFocus.ts`, `Notice.tsx`, `StatusAlert.tsx`, `LanguageSelector.tsx` |
| `src/types/` | `cv.ts` (resume data types) |

## App.tsx

Root UI component.

Responsibilities:

- load resume state through `useCVStorage`
- control the active resume
- open and close the sidebar on small screens
- display confirmation modals for delete and clear actions
- save and restore backups (with the restore confirmation)
- hold the AI settings and open the AI dialogs
- show success and error notices
- connect the form to preview and PDF rendering
- coordinate export with `PDFDownloadLink` and `react-to-print`

## AppHeader.tsx

Header component used by the application shell.

Responsibilities:

- render the title and language selector
- expose "Tailor to a job" and "AI settings" (with a dot when AI is configured)
- render the Backup menu
- expose the PDF download action, with the file name from `pdfMetadata.ts`
- same actions on desktop and mobile
- keep the top bar logic out of `App.tsx`

## CVForm.tsx

Main resume editing form.

Responsibilities:

- edit personal data
- edit professional objective
- add and remove repeatable blocks for experience, education, and projects
- edit technical skills, languages, soft skills, interpersonal competencies, and references
- trigger auto-save on input blur

Main dependencies:

- `react-hook-form`
- `useFieldArray`
- `i18next` for translated labels

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

Side panel for resume management.

Responsibilities:

- list saved resumes in the user's order, select the active one, create a new one
- reorder: drag by the handle on desktop (`@dnd-kit`, also with the keyboard: Space, arrows, Space; Escape cancels; moves are announced to screen readers), or "Move up" / "Move down" in the ⋯ menu on any screen size (on small screens the handle is hidden and the menu is the way to move)
- ⋯ menu per resume (`ActionMenu`): rename (inline field: Enter or leaving saves, Escape cancels), duplicate, move up, move down, delete
- AI-tailored resumes show a ✨ icon, the job as title and the company on the line below
- "Delete all resumes" is a small link in the footer, with confirmation
- all texts come from i18n (`sidebar.*`); the panel is `inert` while closed, so its buttons are not reachable with Tab

Reordering uses `moveCV(id, toIndex)` from `useCVStorage` (action `MOVE`, tested in `useCVStorage.test.ts`); it does not change `updatedAt`. Each list item has separate buttons (handle, select, menu), with no button inside another.

## ActionMenu.tsx

"⋯" button with a list of actions (ARIA menu button): arrows move between items, Home/End jump, Escape closes and returns focus to the button, clicking outside closes. Items can be disabled or marked as `danger`. Opens upward when there is no room below.

## Modal.tsx

Accessible dialog used by every modal in the app.

Responsibilities:

- default cancel/confirm footer (danger or primary), or a custom `footer`
- sizes `md`, `lg`, `xl`; long content scrolls inside the dialog
- title linked with `aria-labelledby`
- move focus into the dialog (`data-autofocus` picks the field), keep Tab inside it, close on Escape or outside click, and return focus to the element that opened it (`useDialogFocus`, shared with `Drawer`)

## Drawer.tsx

Side panel that slides in from the right (480 px; full width on phones), used for the AI settings. The page stays visible behind a light overlay. Header with title and close button, scrollable body and a footer that is always visible. Same keyboard behavior as `Modal` (`useDialogFocus`). The slide-in is a CSS animation that leaves no `transform` on the panel, so `position: fixed` children such as the model list stay positioned against the page; it is skipped when the system asks for reduced motion.

## Notice.tsx

Success and error messages that replace `window.alert()`.

Responsibilities:

- success in a `role="status"` region (auto-closes), errors in a `role="alert"` region (stay until closed)
- live regions are always in the page so screen readers announce new messages

## StatusAlert.tsx

Banner for the result of an action (`success`, `error`, `info`, `busy`) with an icon. An optional `detail` (technical text, such as the provider's message) stays under a collapsed "Technical details". Put it inside a `role="status"` or `role="alert"` region so it is announced.

## BackupMenu.tsx / RestoreBackupModal.tsx

See `import-export-json.md`. The menu explains backups in plain words; the modal shows the file's content and offers "Add to my resumes" or "Replace everything".

## AISettingsDrawer.tsx / ModelCombobox.tsx / TailorJobModal.tsx / TailorResultView.tsx

See `ia-adaptacao-vaga.md`. Settings: provider, key, model, connection test, forget key. The settings open in a `Drawer`; when opened from "Tailor to a job", closing or saving goes back there. `ModelCombobox` follows the ARIA combobox pattern (`aria-expanded`, `aria-activedescendant`, groups with `role="group"`); its list uses `position: fixed` so it floats over the panel instead of making it scroll, and opens scrolled to the selected model. Tailoring: three steps (job → analysis → result) with keyword coverage and a before/after comparison.

## LanguageSelector.tsx

UI language switcher.

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