import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';
import type { CVData, SavedCV } from '@/types/cv';
import { emptyCV } from '@/features/cv-editor/defaultCV';
import { CVForm } from '@/features/cv-editor/CVForm';
import { PDFPreview } from '@/features/pdf/PDFPreview';
import { useCVStorage } from '@/features/cv-editor/useCVStorage';
import { Sidebar } from '@/features/cv-editor/Sidebar';
import { Modal } from '@/shared/components/Modal';
import { AppHeader } from './AppHeader';
import { AISettingsModal } from '@/features/ai/AISettingsModal';
import { TailorJobModal } from '@/features/ai/TailorJobModal';
import { useAISettings } from '@/features/ai/useAISettings';
import {
  BackupError,
  backupFileName,
  createBackup,
  mergeImportedCVs,
  parseBackupFile,
  type ParsedBackup,
} from '@/features/backup/backup';
import { RestoreBackupModal } from '@/features/backup/RestoreBackupModal';
import { Notice, type NoticeMessage } from '@/shared/components/Notice';

function App() {
  const { t, i18n } = useTranslation();
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
    addCV,
  } = useCVStorage();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showTailor, setShowTailor] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const aiSettings = useAISettings();

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

  const showNotice = useCallback((kind: NoticeMessage['kind'], message: string) => {
    setNotice({ kind, message, id: Date.now() });
  }, []);
  const closeNotice = useCallback(() => setNotice(null), []);

  const handleSaveBackup = () => {
    const json = JSON.stringify(createBackup(cvs, activeId), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFileName(i18n.language);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice('success', t('backup.saved', { count: cvs.length }));
  };

  const handleRestoreFile = async (file: File) => {
    try {
      setPendingRestore(parseBackupFile(await file.text()));
    } catch (error) {
      const code = error instanceof BackupError ? error.code : 'not_json';
      showNotice('error', t(`backup.errors.${code}`));
    }
  };

  const handleRestoreAdd = () => {
    if (!pendingRestore) return;
    importCVs(mergeImportedCVs(cvs, pendingRestore.cvs, t('backup.restoredSuffix')), activeId);
    showNotice('success', t('backup.added', { count: pendingRestore.cvs.length }));
    setPendingRestore(null);
  };

  const handleRestoreReplace = () => {
    if (!pendingRestore) return;
    importCVs(pendingRestore.cvs, pendingRestore.activeId);
    showNotice('success', t('backup.replaced', { count: pendingRestore.cvs.length }));
    setPendingRestore(null);
  };

  const handleSaveTailored = (cv: Omit<SavedCV, 'id' | 'updatedAt'>) => {
    addCV(cv);
    showNotice('success', t('ai.tailor.saved', { title: cv.title }));
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

        <AISettingsModal
          isOpen={showAISettings}
          settings={aiSettings.settings}
          onSave={aiSettings.saveSettings}
          onForgetKey={aiSettings.forgetKey}
          onClose={() => setShowAISettings(false)}
        />

        <TailorJobModal
          isOpen={showTailor}
          onClose={() => setShowTailor(false)}
          settings={aiSettings.settings}
          isConfigured={aiSettings.isConfigured}
          onOpenSettings={() => {
            setShowTailor(false);
            setShowAISettings(true);
          }}
          cvs={cvs}
          activeId={activeId}
          onSave={handleSaveTailored}
        />

        <RestoreBackupModal
          backup={pendingRestore}
          currentCount={cvs.length}
          onAdd={handleRestoreAdd}
          onReplace={handleRestoreReplace}
          onCancel={() => setPendingRestore(null)}
        />
      </div>

      <Notice notice={notice} onClose={closeNotice} />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <AppHeader
          data={data}
          activeTitle={activeCV?.title || 'meu_curriculo'}
          onRestoreFile={handleRestoreFile}
          onSaveBackup={handleSaveBackup}
          onDownloadPdf={reactToPrintFn}
          onOpenAISettings={() => setShowAISettings(true)}
          onOpenTailor={() => setShowTailor(true)}
          isAIConfigured={aiSettings.isConfigured}
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
                  <label htmlFor="cv-document-title" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('form.docName')}
                  </label>
                  <input
                    id="cv-document-title"
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
