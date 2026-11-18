# Application Overview

The application is a React-based resume generator that allows users to create, edit, duplicate, delete, and export multiple resumes stored locally.

## Main Flow

1. `src/main.tsx` (the only file at the root of `src/`) initializes React and loads global styles and i18n configuration.
2. `app/App.tsx` orchestrates the main interface, form, sidebar, modals, and PDF preview.
3. `features/cv-editor/useCVStorage.ts` keeps the resume list in state and synchronizes with `localStorage`.
4. `features/cv-editor/CVForm.tsx` edits resume data using `react-hook-form`.
5. `features/pdf/CVDocument.tsx` converts data into a PDF document using `@react-pdf/renderer`.
6. `features/pdf/PDFPreview.tsx` renders the PDF preview inside the UI.

## Folder Structure

- `src/app/`: application shell that combines the features (layout, header, modals).
- `src/features/<name>/`: everything that belongs to one feature (components, hooks, helpers). A feature imports only from `shared/` and `types/`, never from another feature.
- `src/shared/components/`: generic UI with no business rules.
- `src/types/`: data types shared across features.
- `src/styles/index.css`: global styles.
- Imports use the `@/` alias for `src/`, configured in `vite.config.ts` and `tsconfig.app.json`.

## State Structure

The main state is divided into two parts:

- list of saved resumes, each with `id`, `title`, and `updatedAt`
- active resume, used by both the editor and export flow

Persistence uses two browser keys:

- `cv-data` to save the complete resume list
- `cv-selected-id` to restore the active resume
- `ai-settings` for the AI provider, model and the user's API key (never sent anywhere except to that provider)
- `language` for the interface language

## Product Features

- create a new resume from base data
- duplicate an existing resume
- delete a single resume
- clear everything and return to a default resume
- save all resumes to a backup file and restore them (add or replace)
- tailor a resume to a job posting with AI, saved as a new resume
- edit personal data, education, experience, projects, skills, languages, soft skills, interpersonal competencies, and references
- switch between Portuguese and English
- preview the result in A4 format
- download or print the resume as PDF

## Implementation Notes

- The form uses incremental updates to reduce data loss during editing.
- The PDF is generated from the same data source used by the editor, preventing preview/export mismatch.
- The application depends on `localStorage`, so data stays in the user's browser.
- Restoring a backup asks whether to add the resumes or replace everything.
- There is no back-end. The AI feature calls the provider directly from the browser with the user's key; see `ia-adaptacao-vaga.md`.