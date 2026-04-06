import { useRef, useEffect, useState, type ChangeEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';
import type { CVData, SavedCV } from './types';
import { emptyCV } from './data/defaultCV';
import { CVForm } from './components/CVForm';
import { PDFPreview } from './components/PDFPreview';
import { useCVStorage } from './hooks/useCVStorage';
import { Sidebar } from './components/Sidebar';
import { Modal } from './components/Modal';
import { AppHeader } from './components/AppHeader';

function App() {
  const { t } = useTranslation();
  const {
    cvs,
    activeId,
    activeCV,
    setActiveId,
    createCV,
    updateCV,
    deleteCV,
    clearAll,
    duplicateCV,
    importCVs,
  } = useCVStorage();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const initialValues = activeCV ?? emptyCV;
  const { register, control, reset, getValues } = useForm<CVData>({
    defaultValues: initialValues,
  });

  const skipSaveRef = useRef(false);

  useEffect(() => {
    if (activeCV) {
      skipSaveRef.current = true;
      reset(activeCV);
      const t = setTimeout(() => (skipSaveRef.current = false), 0);
      return () => clearTimeout(t);
    }
  }, [activeId, reset, activeCV]);

  const data = useWatch({ control }) as CVData;

  const handleSave = () => {
    if (skipSaveRef.current) return;
    if (!activeId || !data) return;
    const current = getValues();
    console.debug('[App] handleSave saving activeId=', activeId, 'education length=', current.education?.length);
    updateCV(activeId, current);
  };

  const handleRequestDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) deleteCV(pendingDeleteId);
    setPendingDeleteId(null);
    setShowDeleteModal(false);
  };

  const handleRequestClear = () => setShowClearModal(true);

  const handleConfirmClear = () => {
    clearAll();
    setShowClearModal(false);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  const sanitizeImportedCV = (item: unknown): SavedCV | null => {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as Partial<SavedCV>;
    if (typeof candidate.id !== 'string' || !candidate.id.trim()) return null;
    if (typeof candidate.title !== 'string') return null;
    if (typeof candidate.fullName !== 'string') return null;
    if (typeof candidate.jobTitle !== 'string') return null;
    if (typeof candidate.address !== 'string') return null;
    if (typeof candidate.phone !== 'string') return null;
    if (typeof candidate.email !== 'string') return null;
    if (typeof candidate.linkedin !== 'string') return null;
    if (typeof candidate.objective !== 'string') return null;
    if (typeof candidate.skills !== 'string') return null;
    if (!Array.isArray(candidate.education)) return null;
    if (!Array.isArray(candidate.experience)) return null;

    return {
      ...candidate,
      updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : Date.now(),
      education: candidate.education,
      experience: candidate.experience,
      references: Array.isArray(candidate.references) ? candidate.references : [],
      projects: Array.isArray(candidate.projects) ? candidate.projects : [],
      languages: typeof candidate.languages === 'string' ? candidate.languages : '',
      softSkills: typeof candidate.softSkills === 'string' ? candidate.softSkills : '',
      interpersonalSkills:
        typeof candidate.interpersonalSkills === 'string'
          ? candidate.interpersonalSkills
          : '',
      linkedinName: typeof candidate.linkedinName === 'string' ? candidate.linkedinName : '',
      github: typeof candidate.github === 'string' ? candidate.github : '',
      githubName: typeof candidate.githubName === 'string' ? candidate.githubName : '',
      portfolio: typeof candidate.portfolio === 'string' ? candidate.portfolio : '',
      portfolioName: typeof candidate.portfolioName === 'string' ? candidate.portfolioName : '',
    } as SavedCV;
  };

  const handleExportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      activeId,
      cvs,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `resume-backup-${dateTag}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as {
        cvs?: unknown;
        activeId?: unknown;
      } | unknown[];

      const importedList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.cvs)
          ? parsed.cvs
          : [];

      const normalized = importedList
        .map(sanitizeImportedCV)
        .filter((cv): cv is SavedCV => cv !== null);

      if (normalized.length === 0) {
        window.alert(t('header.importInvalid'));
        return;
      }

      const preferredActiveId =
        !Array.isArray(parsed) && typeof parsed.activeId === 'string'
          ? parsed.activeId
          : null;

      const imported = importCVs(normalized, preferredActiveId);
      if (!imported) {
        window.alert(t('header.importInvalid'));
        return;
      }

      window.alert(t('header.importSuccess'));
    } catch {
      window.alert(t('header.importError'));
    } finally {
      event.target.value = '';
    }
  };

  const currentCV = activeCV ?? emptyCV;

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <Sidebar
        cvs={cvs}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onCreate={() => {
          createCV();
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onDuplicate={(id: string) => {
          duplicateCV(id);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onRequestDelete={handleRequestDelete}
        onRequestClear={handleRequestClear}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Modals rendered at App level so they are outside sidebar stacking context */}
      <div>
        <Modal
          isOpen={showDeleteModal}
          title={t('modal.confirmDelete')}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          confirmLabel={t('modal.delete')}
          cancelLabel={t('modal.cancel')}
        >
          <p>{t('modal.deleteMessage')}</p>
        </Modal>

        <Modal
          isOpen={showClearModal}
          title={t('modal.clearData')}
          onCancel={() => setShowClearModal(false)}
          onConfirm={handleConfirmClear}
          confirmLabel={t('modal.clear')}
          cancelLabel={t('modal.cancel')}
        >
          <p>{t('modal.clearMessage')}</p>
        </Modal>
      </div>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AppHeader
          data={data}
          activeTitle={activeCV?.title || 'meu_curriculo'}
          onImportData={handleImportData}
          onExportData={handleExportData}
          onDownloadPdf={reactToPrintFn}
        />

        <main className="flex-1 mx-auto w-full p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Editor Column */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-700">
                {t('header.edit')}
              </h2>
              <div key={activeId}>
                {/* CV Title Input */}
                <div className="bg-white p-6 shadow rounded-lg mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.docName')}
                  </label>
                  <input
                    type="text"
                    defaultValue={activeCV?.title ?? 'Novo Currículo'}
                    onBlur={(e) => {
                      if (activeId) {
                        updateCV(activeId, { title: e.target.value });
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                    placeholder={t('form.docNamePlaceholder')}
                  />
                </div>

                <CVForm
                  defaultValues={currentCV}
                  onSubmit={() => {}}
                  register={register}
                  control={control}
                  onSave={handleSave}
                />
              </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="flex justify-between items-baseline">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">
                    {t('header.preview')}
                  </h2>
                </div>
                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {t('header.a4Preview')}
                </span>
              </div>

              {/* PDF Download Button */}
              <div className="flex justify-center">
                <PDFPreview data={data} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
