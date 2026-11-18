# Application Overview

The application is a React-based resume generator that allows users to create, edit, duplicate, delete, and export multiple resumes stored locally.

## Main Flow

1. `main.tsx` initializes React and loads i18n configuration.
2. `App.tsx` orchestrates the main interface, form, sidebar, modals, and PDF preview.
3. `useCVStorage.ts` keeps the resume list in state and synchronizes with `localStorage`.
4. `CVForm.tsx` edits resume data using `react-hook-form`.
5. `CVDocument.tsx` converts data into a PDF document using `@react-pdf/renderer`.
6. `PDFPreview.tsx` renders the PDF preview inside the UI.

## State Structure

The main state is divided into two parts:

- list of saved resumes, each with `id`, `title`, and `updatedAt`
- active resume, used by both the editor and export flow

Persistence uses two browser keys:

- `cv-data` to save the complete resume list
- `cv-selected-id` to restore the active resume

## Product Features

- create a new resume from base data
- duplicate an existing resume
- delete a single resume
- clear everything and return to a default resume
- export all saved resumes to a JSON backup file
- import resumes from a JSON backup file
- edit personal data, education, experience, projects, skills, languages, soft skills, interpersonal competencies, and references
- switch between Portuguese and English
- preview the result in A4 format
- download or print the resume as PDF

## Implementation Notes

- The form uses incremental updates to reduce data loss during editing.
- The PDF is generated from the same data source used by the editor, preventing preview/export mismatch.
- The application depends on `localStorage`, so data stays in the user's browser.
- JSON import restores the saved resume list and the active resume when the backup includes it.