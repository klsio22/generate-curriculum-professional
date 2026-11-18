import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { CVData, SavedCV } from '@/types/cv';
import { emptyCV } from '@/features/cv-editor/defaultCV';
import { CVForm } from '@/features/cv-editor/CVForm';
import { PDFPreview } from '@/features/pdf/PDFPreview';
import { useCVStorage } from '@/features/cv-editor/useCVStorage';
import { Sidebar } from '@/features/cv-editor/Sidebar';
import { App as AntdApp, Card, Form, Input, Tag } from 'antd';
import { AppHeader } from './AppHeader';
import { AISettingsDrawer } from '@/features/ai/AISettingsDrawer';
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
import { ImportPdfModal, type PdfImportState } from '@/features/pdf-import/ImportPdfModal';
import { BackupMenu } from '@/features/backup/BackupMenu';
import { AISettingsButton } from '@/features/ai/AISettingsButton';
import { TailorButton } from '@/features/ai/TailorButton';
import { DownloadPdfButton } from '@/features/pdf/DownloadPdfButton';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { pdfImportErrorCode } from '@/features/pdf-import/pdfImportError';

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
    moveCV,
  } = useCVStorage();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [returnToTailor, setReturnToTailor] = useState(false);
  const [showTailor, setShowTailor] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [pdfImport, setPdfImport] = useState<PdfImportState | null>(null);
  const pdfImportRunRef = useRef(0);
  const { modal, message, notification } = AntdApp.useApp();
  const aiSettings = useAISettings();
  const isPushLayout = useMediaQuery('(min-width: 1280px)');
  const isSidebarPushed = isPushLayout && isSidebarOpen;

  const initialValues = activeCV ?? emptyCV;
  const { control, reset, getValues } = useForm<CVData>({
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
    modal.confirm({
      title: t('modal.confirmDelete'),
      content: t('modal.deleteMessage'),
      okText: t('modal.delete'),
      okButtonProps: { danger: true },
      cancelText: t('modal.cancel'),
      onOk: () => deleteCV(id),
    });
  };

  const handleRequestClear = () => {
    modal.confirm({
      title: t('modal.clearData'),
      content: t('modal.clearMessage'),
      okText: t('modal.clear'),
      okButtonProps: { danger: true },
      cancelText: t('modal.cancel'),
      onOk: clearAll,
    });
  };


  const showNotice = useCallback(
    (kind: 'success' | 'error', content: string) => {
      if (kind === 'success') message.success({ content, duration: 6 });
      else notification.error({ title: content, duration: 0, placement: 'bottomRight' });
    },
    [message, notification],
  );

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

  const handleImportPdf = async (file: File) => {
    const run = ++pdfImportRunRef.current;
    setPdfImport({ fileName: file.name, result: null });
    try {
      const { importResumePdf } = await import('@/features/pdf-import/importResumePdf');
      const result = await importResumePdf(file);
      if (run === pdfImportRunRef.current) setPdfImport({ fileName: file.name, result });
    } catch (error) {
      if (run !== pdfImportRunRef.current) return;
      setPdfImport(null);
      showNotice('error', t(`pdfImport.errors.${pdfImportErrorCode(error)}`));
    }
  };

  const handleCancelPdfImport = () => {
    pdfImportRunRef.current++;
    setPdfImport(null);
  };

  const handleCreateFromPdf = (cv: CVData, title: string) => {
    addCV({ ...cv, title });
    setPdfImport(null);
    showNotice('success', t('pdfImport.created', { title }));
  };

  const pdfTitle = activeCV?.title || 'meu_curriculo';
  const handleDownloadError = () => showNotice('error', t('header.downloadError'));

  const closeSidebarIfOverlay = () => {
    if (!isPushLayout) setIsSidebarOpen(false);
  };

  const handleOpenAISettings = () => {
    closeSidebarIfOverlay();
    setShowAISettings(true);
  };

  const handleSaveTailored = (cv: Omit<SavedCV, 'id' | 'updatedAt'>) => {
    addCV(cv);
    showNotice('success', t('ai.tailor.saved', { title: cv.title }));
  };


  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <Sidebar
        cvs={cvs}
        activeId={activeId}
        onSelect={(id) => {
          setActiveId(id);
          closeSidebarIfOverlay();
        }}
        onCreate={() => {
          createCV();
          closeSidebarIfOverlay();
        }}
        onDuplicate={(id: string) => {
          duplicateCV(id);
          closeSidebarIfOverlay();
        }}
        onRename={(id, title) => updateCV(id, { title })}
        onMove={moveCV}
        onRequestDelete={handleRequestDelete}
        onRequestClear={handleRequestClear}
        isOpen={isSidebarOpen}
        isPushed={isPushLayout}
        onClose={() => setIsSidebarOpen(false)}
        footerActions={
          <>
            <AISettingsButton isConfigured={aiSettings.isConfigured} onClick={handleOpenAISettings} />
            <BackupMenu onSaveBackup={handleSaveBackup} onRestoreFile={handleRestoreFile} onImportPdf={handleImportPdf} />
          </>
        }
      />

      <div>
        <AISettingsDrawer
          isOpen={showAISettings}
          settings={aiSettings.settings}
          onSave={aiSettings.saveSettings}
          onForgetKey={aiSettings.forgetKey}
          onClose={() => {
            setShowAISettings(false);
            if (returnToTailor) {
              setReturnToTailor(false);
              setShowTailor(true);
            }
          }}
        />

        <TailorJobModal
          isOpen={showTailor}
          onClose={() => setShowTailor(false)}
          settings={aiSettings.settings}
          isConfigured={aiSettings.isConfigured}
          onOpenSettings={() => {
            setShowTailor(false);
            setReturnToTailor(true);
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

        <ImportPdfModal state={pdfImport} onCreate={handleCreateFromPdf} onCancel={handleCancelPdfImport} />
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ${isSidebarPushed ? 'pl-72' : ''}`}
      >
        <AppHeader
          data={data}
          activeTitle={pdfTitle}
          onDownloadError={handleDownloadError}
          onOpenTailor={() => setShowTailor(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 mx-auto w-full p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="md:hidden">
                <TailorButton size="large" block onClick={() => setShowTailor(true)} />
              </div>
              <h2 className="text-xl font-semibold text-gray-700">
                {t('header.edit')}
              </h2>
              <div key={activeId}>
                <Card className="mb-4 shadow-sm">
                  <Form layout="vertical" component={false}>
                    <Form.Item label={t('form.docName')} htmlFor="cv-document-title" className="mb-0">
                      <Input
                        key={activeCV?.title}
                        id="cv-document-title"
                        defaultValue={activeCV?.title ?? 'Novo Currículo'}
                        onBlur={(e) => {
                          if (activeId) {
                            updateCV(activeId, { title: e.target.value });
                          }
                        }}
                        placeholder={t('form.docNamePlaceholder')}
                      />
                    </Form.Item>
                  </Form>
                </Card>

                <CVForm control={control} onSave={handleSave} />
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="flex justify-between items-baseline">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">
                    {t('header.preview')}
                  </h2>
                </div>
                <Tag>{t('header.a4Preview')}</Tag>
              </div>

              <div className="flex justify-center">
                <PDFPreview data={data} />
              </div>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <DownloadPdfButton
            data={data}
            activeTitle={pdfTitle}
            onError={handleDownloadError}
            size="large"
            block
          />
        </div>
      </div>
    </div>
  );
}

export default App;
