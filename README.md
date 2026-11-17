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
| **Multiple Resumes** | Create, duplicate, and manage multiple resume versions |
| **Responsive Design** | Adaptive interface with Tailwind CSS and DaisyUI |

---

## **🛠️ Tech Stack**

```
React 19 .................. Modern UI library with hooks
TypeScript 5.9 ............ Static typing for robust code
Vite ...................... Fast and optimized build tool
Tailwind CSS + DaisyUI .... Utility-first styling and UI components
React Hook Form ........... High-performance form state management
@react-pdf/renderer ....... Browser-based PDF rendering/generation
react-to-print ............ Native browser printing integration
Lucide React .............. Modern and consistent icon set
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

---

## **📁 Project Structure**

```
src/
├── main.tsx ..................... Entry point (the only file at the root)
├── app/
│   ├── App.tsx .................. Application shell: wires features together
│   └── AppHeader.tsx ............ Top bar (language, import/export, PDF)
├── features/
│   ├── cv-editor/
│   │   ├── CVForm.tsx ........... Resume editing form
│   │   ├── Sidebar.tsx .......... Resume list and management
│   │   ├── useCVStorage.ts ...... Local persistence (full CRUD)
│   │   └── defaultCV.ts ......... Initial resume data
│   └── pdf/
│       ├── CVDocument.tsx ....... PDF document / export
│       ├── PDFPreview.tsx ....... A4 preview + PDF viewer
│       ├── pdfStyles.ts ......... PDF-specific styling
│       └── textUtils.ts ......... Text formatting utilities (dates, URLs)
├── shared/
│   └── components/
│       ├── Modal.tsx ............ Dialog component
│       └── LanguageSelector.tsx . Language switcher
├── i18n/
│   ├── config.ts
│   └── locales/
├── styles/
│   └── index.css ................ Global styles (Tailwind + daisyUI)
└── types/
    └── cv.ts .................... Resume data types
```

Each feature folder holds everything that belongs to it. Features import only from `shared/` and `types/`; `app/` is the place that combines them. Imports use the `@/` alias for `src/` (for example `@/features/pdf/CVDocument`).

---

## **🌐 Deployment**

### **Vercel (recommended)**

1. Connect your GitHub repository on [Vercel](https://vercel.com)
2. **Environment variables:** none required
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