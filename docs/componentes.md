# Components

This document describes the responsibility of each component in `src/components` and related core modules.

## App.tsx

Root UI component.

Responsibilities:

- load resume state through `useCVStorage`
- control the active resume
- open and close the sidebar on small screens
- display confirmation modals for delete and clear actions
- handle JSON import/export actions from the header
- connect the form to preview and PDF rendering
- coordinate export with `PDFDownloadLink` and `react-to-print`

## AppHeader.tsx

Header component used by the application shell.

Responsibilities:

- render the title and language selector
- expose the JSON import trigger on desktop and mobile
- expose the JSON export action
- expose the PDF download action
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

- list saved resumes
- select active resume
- create a new resume
- duplicate a resume
- request resume deletion
- request full data clearing
- handle responsive behavior on smaller screens

## Modal.tsx

Generic confirmation dialog.

Responsibilities:

- show delete and clear confirmations
- close on outside click or Escape key
- render title, content, and confirm/cancel actions

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