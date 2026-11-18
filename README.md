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
├── App.tsx
├── main.tsx
├── index.css
├── types.ts
├── assets/
├── components/
│   ├── CVDocument.tsx ........... PDF document / export
│   ├── CVForm.tsx ............... Resume editing form
│   ├── Modal.tsx ................ Dialog component
│   ├── PDFPreview.tsx ........... A4 preview + PDF viewer
│   ├── Sidebar.tsx .............. Resume list and management
│   └── LanguageSelector.tsx ..... Language switcher
├── data/
│   └── defaultCV.ts ............. Initial resume data
├── hooks/
│   └── useCVStorage.ts .......... Local persistence (full CRUD)
├── i18n/
│   ├── config.ts
│   └── locales/
├── styles/
│   └── pdfStyles.ts ............. PDF-specific styling
└── utils/
	└── textUtils.ts ............. Text formatting utilities (dates, URLs)
```

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
| `src/styles/pdfStyles.ts` | PDF margins, fonts, and spacing |
| `src/data/defaultCV.ts` | Default resume seed data |

---

## **📄 License**

MIT © 2024 Klesio

---

## **🔗 Links**

- 🌐 **Demo:** [generate-curriculum-professional.vercel.app](https://generate-curriculum-professional.vercel.app/)
- 💼 **Portfolio:** [klesio-dev.vercel.app](https://klesio-dev.vercel.app/)
- 💻 **GitHub:** [github.com/klsio22](https://github.com/klsio22)