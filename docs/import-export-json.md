# Backup (save and restore)

Resumes live only in the browser's `localStorage`. If the browser data is cleared, they are gone. The **Backup** menu in the header lets the user keep a copy in a file and bring it back later, on the same or another browser.

The menu explains this in plain words, so users do not need to know what JSON is:

- **Save backup**: downloads a file with all resumes.
- **Restore backup**: opens a backup file and asks what to do before changing anything.

Code: `src/features/backup/` (`backup.ts` for the logic, `BackupMenu.tsx` and `RestoreBackupModal.tsx` for the UI).

The same menu has **Import resume from PDF**, for when there is no backup but there is a resume in PDF. See `importar-pdf.md`.

## Backup file

File name: `curriculos-backup-YYYY-MM-DD.json` (Portuguese UI) or `resume-backup-YYYY-MM-DD.json` (English UI).

```json
{
  "version": 1,
  "exportedAt": "2026-11-17T12:00:00.000Z",
  "activeId": "resume-id",
  "cvs": []
}
```

- `version`: schema version for future migrations
- `exportedAt`: when the backup was made (shown when restoring)
- `activeId`: the resume that was selected
- `cvs`: every saved resume, including the optional `meta` of AI-tailored resumes and the optional resume language `locale` (`pt-BR` or `en`; any other value is dropped when restoring)

A plain array of resumes is also accepted.

## Restoring

1. The file is read and validated (`parseBackupFile`).
2. A dialog shows how many resumes the file has, their titles and the backup date.
3. The user chooses:
   - **Add to my resumes** (default, focused first): keeps the current resumes and adds the ones from the file. A restored resume whose id already exists gets a new id and the suffix "(restaurado)" / "(restored)" (`mergeImportedCVs`).
   - **Replace everything**: deletes the current resumes and keeps only the file's. The dialog says how many resumes will be deleted.
4. The result is announced in a notice (`role="status"`); errors use `role="alert"`. There are no `alert()` popups.

## Validation

A resume is accepted when it has:

- a non-empty `id`
- a `title` or a `fullName` (the name becomes the title when the title is missing)
- `education` and `experience` lists

Empty text fields (address, phone, links...) are normal and are kept empty. Missing optional lists (projects, references) become empty lists.

If no resume in the file passes, the user sees why: the file is not JSON, or it is not a backup from this app.

## Storage behavior

After restoring, the list is written back to `localStorage` by `useCVStorage` and editing continues to autosave as before.
