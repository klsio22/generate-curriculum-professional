# ATS readiness

Applicant tracking systems (Gupy, Workday, Greenhouse...) extract the text of the PDF and fill a form from it before anyone reads the resume. There is no official ATS score: each system reads in its own way, and keyword matching depends on the job. What can be guaranteed and measured is that the PDF **reads back correctly as text**, which is what this document covers.

## In the app

"ATS check" in the ▾ menu of "Tailor to a job" checks the open resume (`src/features/ats/`, `AtsDrawer.tsx`). It generates the PDF in the browser, reads it back as described below and shows "N of 13 items ok", with what to fix and in which field for each rule that fails (e.g. change "Março de 2026" to "Mar 2026"). It does not use the AI, needs no key and nothing leaves the browser.

The rules are pure functions in `atsRules.ts` (`analyzeResume`), tested in `atsRules.test.ts`. The same function runs on the sample resume in the checklist test, so the screen and the sample cannot drift apart.

### Fixing

Under the summary, a "Fixes" box splits the warnings in three groups (`atsFixes.ts`, pure and tested):

| Group | Who fixes | Warnings |
|---|---|---|
| Structural | the app, after a confirmation that lists each change | dates in another format the app can read (`03/2022`, `2022-03`, `mar 2022`, `MAR/2022`, `Março de 2022` → `Mar 2022`, in the resume language); start and end swapped; a headline written as a list (`Role | Area (React • Node.js)`) keeps only the role, and the technologies in parentheses move to the skills when missing; skills and soft skills on one line or repeated (split on `,` `;` `•` `|` outside parentheses, a `Label:` prefix removed, repeats dropped); a link display name that hides the address (cleared) |
| Text | the AI, in the chat: "Fix with the AI" opens it with the request written from the failing rules | a long headline the app cannot shorten, list of technologies in the objective, long skill lines or few skills (only technologies the resume already mentions), long paragraphs, results without numbers (the AI splits the description into short result lines and asks for the numbers, it does not invent), mixed languages, more than 2 pages (it shortens the objective, long descriptions, interpersonal skills and education topics, keeping roles, companies, dates, technologies and numbers, and never removes a job) |
| The user's own data | only warned, never changed (`USER_ONLY`) | name, e-mail, phone, city, missing sections, entries without role, company or course, a missing start date, dates in the future, dates the app cannot read, month and year-only dates mixed |

After applying, the panel lists what was changed ("Changed automatically") until it is closed. Automatic fixes are recorded in the AI history ("Automatic fixes from the ATS check") and can be undone with "Restore this version" (dates and skills; the link display names are not part of the history's content). AI fixes go through the chat's proposal, Apply and history, with its guards: contact data and dates never change and nothing is invented. The analysis runs again after an automatic fix.

### The 13 rules

| Rule | Warns when |
|---|---|
| All the text in the PDF is recognized | a line of the PDF is not read into any field |
| The data reads back as typed | name, e-mail, phone, city, a job (role, company, dates) or the number of education entries comes back different |
| Complete contact data | name, e-mail, phone (10 to 15 digits) or city is missing, or the e-mail is not valid |
| One short headline | it is empty, longer than 60 characters, or a list (`|`, `•`, `·`, `;`) |
| Links readable as text | a link shows a display name instead of its address, or the address has accents or spaces |
| Standard sections filled in | profile, experience (or a project), education or skills is missing |
| Dates in one format, in order and in the past | a date is not `Mmm AAAA` or `AAAA` (with a suggestion for written months), a job has no start, start is after end, a date is in the future (an education end date may be, as the expected completion), or month and year-only dates are mixed; "Atual" / "Present" counts as ongoing |
| Complete jobs and education | a job has no role, company or description; an education entry has no course or institution |
| Results in short lines, with numbers | a job has a line over 350 characters or no number at all |
| Skills as a list | fewer than 5 skills, a skill longer than 40 characters, or a list of technologies inside the profile |
| One language | the chosen resume language does not match the text, or profile, jobs and education are in different languages |
| Up to 2 pages | the PDF has more pages |
| Accents preserved | the extracted text has lost characters |

## How it is checked

A test, not the AI: `src/features/pdf-import/atsChecklist.test.tsx` runs with `npm test`, offline and with the same result every time.

1. Generates the PDF of the sample resume (`defaultCV.ts`) with the same `CVDocument` the app downloads.
2. Extracts the text with `pdfjs-dist`, as a text-only reader would (`extractPdf.ts`).
3. Reads it back into resume fields with the PDF import reader (`parseResume.ts`).
4. Checks the rules: the app's `analyzeResume` must find nothing to fix, and each sample-only rule below is one test, so a failure names what is wrong.

The helper that renders and reads a PDF back is shared with the round-trip test (`pdf-import/testing/readBack.tsx`).

## Rules checked on the sample

The sample also meets stricter rules than the screen, so it works as a model:

| Rule | Why |
|---|---|
| Every line of the PDF is read into a field | Nothing is lost or misplaced |
| Name, headline, e-mail, phone (`(DD) 9XXXX-XXXX`) and city (`City, UF`) are read back as typed | Recruiters filter by location and contact the candidate |
| Links are printed as their address (`linkedin.com/in/...`), not a nickname | Many ATS ignore PDF link annotations and keep only the visible text |
| Profile, experience, education, projects, skills, languages and soft skills are recognized | Standard section titles map to the ATS form |
| Dates in one format (`Mmm AAAA`, e.g. `Jan 2022`), start before end, none in the future; only a job may be current | Years of experience are computed from the dates |
| Each entry has its title, organization and description | Empty fields lower the match |
| Each job lists results as bullet items (a subheading ending with `:` followed by lines), each with a number | Short, measurable lines are parsed and read better |
| Accented text is extracted without lost characters | Font and encoding problems break keywords |
| Skills are a plain list, one per line, with the technologies the profile names | Keyword matching reads the skills section first |
| The whole resume is in one language | Mixed languages confuse parsing and matching |
| Fits in two pages | Longer resumes are cut or skimmed |
| PDF metadata names the candidate, the role and the skills | Some systems show or index the title and keywords |
| A current job ends with the word in the resume language ("Atual" / "Current") | The date range stays readable in English resumes |

The PDF layout already meets the format side: one column, real selectable text, reading order top to bottom, no tables or images with text, and standard fonts.

## What it does not cover

- The keywords of a specific job: use "Tailor to a job" (`ia-adaptacao-vaga.md`), which shows the coverage.
