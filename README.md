# **Curriculum Generator**

> **Web application for creating, editing, and exporting professional resumes in ABNT format**, with real-time preview and PDF export.

🚀 **Live demo:** [generate-curriculum-professional.vercel.app](https://generate-curriculum-professional.vercel.app/)

---

## **✨ Main Features**

| Feature | Description |
|---------|-------------|
| **Smart Editor** | Form with real-time updates and local persistence (localStorage) |
| **ABNT A4 Preview** | Accurate resume preview in Brazilian A4 format |
| **PDF Export** | Professional PDF generation ready for printing or sharing |
| **Multiple Resumes** | Create, duplicate, rename and reorder resumes (drag on desktop, move up/down from the ⋯ menu on any screen) |
| **Tailor to a Job (AI)** | Paste a job posting and get a new resume aimed at it, with keyword coverage and a before/after review. Uses your own API key (OpenRouter, Gemini or any OpenAI-compatible API), no back-end. See [docs/ia-adaptacao-vaga.md](docs/ia-adaptacao-vaga.md) |
| **Backup** | Save all resumes to a file and restore them later, choosing to add or replace. See [docs/import-export-json.md](docs/import-export-json.md) |
| **Import from PDF** | Read an existing resume in PDF and create a new resume with its data, after a review. Runs in the browser, no AI. See [docs/importar-pdf.md](docs/importar-pdf.md) |
| **PDF Metadata** | Title, author, subject and keywords filled in; file named after the person and the job |
| **Responsive Design** | Ant Design components with a Tailwind CSS layout, from phone to desktop |

---

## **🛠️ Tech Stack**

```
React 19 .................. Modern UI library with hooks
TypeScript 5.9 ............ Static typing for robust code
Vite ...................... Fast and optimized build tool
Ant Design 6 ............. UI components (buttons, fields, dialogs, menus)
Tailwind CSS ............. Layout and spacing
React Hook Form ........... High-performance form state management
@react-pdf/renderer ....... Browser-based PDF rendering/generation
Lucide React .............. Modern and consistent icon set
Vitest .................... Unit tests
```

> 📦 Check `package.json` for exact versions and dependencies.

---

## **🚀 Getting Started**

### **Local development**

```bash
# Clone the repository
git clone https://github.com/your-username/curriculum-generator.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

### **Production build**

```bash
# Create optimized build
npm run build

# Preview production build locally
npm run preview
```

### **Tests and lint**

```bash
npm test          # run unit tests once
npm run test:watch
npm run lint
```

---

## **📁 Project Structure**

```
src/
├── main.tsx ..................... Entry point (the only file at the root)
├── app/
│   ├── App.tsx .................. Application shell: wires features together
│   ├── AppHeader.tsx ............ Top bar (language, AI, backup, PDF)
│   └── AntdProvider.tsx ......... Ant Design theme, locale and CSS layer
├── features/
│   ├── cv-editor/
│   │   ├── CVForm.tsx ........... Resume editing form (built from field lists)
│   │   ├── DocumentSettings.tsx . Document name and resume language
│   │   ├── Sidebar.tsx .......... Resume list: reorder, rename, menu
│   │   ├── useCVStorage.ts ...... Local persistence (full CRUD)
│   │   ├── defaultCV.ts ......... Initial resume data
│   │   └── components/ .......... FormField, FormSection, RepeatableList
│   ├── pdf/
│   │   ├── CVDocument.tsx ....... PDF document / export
│   │   ├── PDFPreview.tsx ....... A4 preview + PDF viewer
│   │   ├── pdfMetadata.ts ....... PDF properties and file name
│   │   ├── pdfStyles.ts ......... PDF-specific styling
│   │   └── textUtils.ts ......... Text formatting utilities (dates, URLs)
│   ├── backup/
│   │   ├── backup.ts ............ Save/restore logic and validation
│   │   ├── BackupMenu.tsx ....... Header menu with plain-language help
│   │   └── RestoreBackupModal.tsx Add or replace confirmation
│   ├── history/
│   │   ├── history.ts ........... AI history entries: limit, restore, storage
│   │   ├── useCVHistory.ts ...... History stored locally
│   │   └── HistoryDrawer.tsx .... History panel with before/after and restore
│   └── ai/
│       ├── client.ts ............ OpenAI-compatible API client
│       ├── providers.ts ......... OpenRouter / Gemini / custom presets
│       ├── prompts.ts ........... Prompts (contact data is never sent)
│       ├── parse.ts ............. Answer validation and anti-invention merge
│       ├── jobTailoring.ts ...... Analyze job + tailor resume
│       ├── keywords.ts .......... Keyword coverage counted in code
│       ├── useAISettings.ts ..... Provider settings (stored locally)
│       ├── AISettingsDrawer.tsx . Provider, key and model setup (side panel)
│       ├── ModelCombobox.tsx .... Model field: search, groups, free filter
│       ├── AIActions.tsx ........ Tailor button with the AI menu (chat, translate, history)
│       ├── TailorJobModal.tsx ... Job → analysis → result dialog
│       ├── TailorResultView.tsx . Coverage table and before/after
│       ├── ResumeComparison.tsx . Before/after per section
│       ├── compareResumes.ts .... Builds the before/after list, matching items by id
│       ├── translation.ts ....... Translate a resume (anti-invention merge)
│       ├── TranslateModal.tsx ... Translate dialog with review
│       ├── refine.ts ............ Chat answers: guarded patch and declared facts
│       └── RefineChatDrawer.tsx . Chat panel with proposals to apply
├── shared/
│   ├── locale.ts ................ Resume language: detect, fall back, guess from text
│   └── components/
│       ├── StatusAlert.tsx ...... Result banner with technical details
│       ├── useFocusReturn.ts .... Focus back to the menu button after Escape
│       ├── LanguageSelector.tsx . Language switcher
│       └── LocaleFlag.tsx ....... Round flag for PT / EN
├── i18n/
│   ├── config.ts
│   └── locales/
├── styles/
│   └── index.css ................ Global styles (Tailwind, cascade layers for antd)
└── types/
    └── cv.ts .................... Resume data types
```

Each feature folder holds everything that belongs to it. Features import only from `shared/` and `types/`; `app/` is the place that combines them. Imports use the `@/` alias for `src/` (for example `@/features/pdf/CVDocument`).

---

## **🌐 Deployment**

### **Vercel (recommended)**

1. Connect your GitHub repository on [Vercel](https://vercel.com)
2. **Environment variables:** none required (the AI feature uses each user's own key, entered in the app)
3. **Build command:** `npm run build` (auto-detected)

### **Manual deployment via CLI**

```bash
npm run build
vercel --prod
```

---

## **⚙️ Customization**

| File | What to edit |
|------|---------------|
| `src/features/pdf/pdfStyles.ts` | PDF margins, fonts, and spacing |
| `src/features/cv-editor/defaultCV.ts` | Default resume seed data |

---

## **📄 License**

MIT © 2024 Klesio

---

## **🔗 Links**

- 🌐 **Demo:** [generate-curriculum-professional.vercel.app](https://generate-curriculum-professional.vercel.app/)
- 💼 **Portfolio:** [klesio-dev.vercel.app](https://klesio-dev.vercel.app/)
- 💻 **GitHub:** [github.com/klsio22](https://github.com/klsio22)