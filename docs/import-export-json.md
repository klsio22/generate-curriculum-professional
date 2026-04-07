# JSON Import and Export

This feature adds a portable JSON backup flow for all saved resumes.

## Goal

The application now allows users to:

- export all saved resumes to a `.json` file
- import the same file later into the application
- keep `localStorage` as the primary persistence layer after import

## Export flow

When the user clicks Export JSON in the header, the application creates a file with this shape:

```json
{
  "version": 1,
  "exportedAt": "2026-04-06T12:00:00.000Z",
  "activeId": "resume-id",
  "cvs": []
}
```

The payload includes:

- `version`: simple schema versioning for future migrations
- `exportedAt`: timestamp of the backup generation
- `activeId`: the currently selected resume
- `cvs`: the complete list of saved resumes

## Import flow

The import button opens a local file picker and accepts either:

- an array of resumes, or
- an object with `cvs` and optional `activeId`

During import, the application:

1. parses the JSON file
2. validates the minimum resume fields
3. restores the saved list into application state
4. updates `localStorage` automatically through the existing storage hook

If the backup contains a valid `activeId`, the app restores that resume as active. Otherwise it falls back to the first imported resume.

## Validation rules

The import is intentionally strict on the essential fields:

- `id`
- `title`
- `fullName`
- `jobTitle`
- `address`
- `phone`
- `email`
- `linkedin`
- `objective`
- `skills`
- `education`
- `experience`

Optional fields such as projects, references, languages, soft skills, and social links are normalized when missing.

## Storage behavior

Importing does not replace the persistence model. After the state is restored:

- the resume list is written back to `localStorage`
- the selected resume id is saved separately
- normal editing continues to autosave as before

## UI placement

The actions are exposed in the header for both desktop and mobile:

- Import JSON
- Export JSON
- Download Resume

This keeps the feature visible without duplicating logic across the application.