import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { CVData, SavedCV } from '@/types/cv';
import { emptyCV } from '@/features/cv-editor/defaultCV';
import { CVForm } from '@/features/cv-editor/CVForm';
import { PDFPreview } from '@/features/pdf/PDFPreview';
import { useCVStorage } from '@/features/cv-editor/useCVStorage';
import { Sidebar } from '@/features/cv-editor/Sidebar';
import { DocumentSettings } from '@/features/cv-editor/DocumentSettings';
import { contentLocaleOf, detectResumeLocale, guessResumeLocale, otherLocale } from '@/shared/locale';
import { App as AntdApp, Tag } from 'antd';
import { AppHeader } from './AppHeader';
import { AISettingsDrawer } from '@/features/ai/AISettingsDrawer';
import { TailorJobModal } from '@/features/ai/TailorJobModal';
import { TranslateModal } from '@/features/ai/TranslateModal';
import { useAISettings } from '@/features/ai/useAISettings';
import {
  BackupError,
  backupFileName,
  createBackup,
  mergeImportedCVs,
  parseBackupFile,
  restoredIdMap,
  type ParsedBackup,
} from '@/features/backup/backup';
import { RestoreBackupModal } from '@/features/backup/RestoreBackupModal';
import { useCVHistory } from '@/features/history/useCVHistory';
import { contentOf, entriesFor, type HistoryEntry, type HistoryRecord, type ResumeContent } from '@/features/history/history';
import { HistoryDrawer } from '@/features/history/HistoryDrawer';
import { AtsDrawer } from '@/features/ats/AtsDrawer';
import { ImportPdfModal, type PdfImportState } from '@/features/pdf-import/ImportPdfModal';
import { BackupMenu } from '@/features/backup/BackupMenu';
import { AISettingsButton } from '@/features/ai/AISettingsButton';
import { AIActions, type AIActionsProps } from '@/features/ai/AIActions';
import { RefineChatDrawer } from '@/features/ai/RefineChatDrawer';
import { clearChats, keepChatsFor, removeChatFor } from '@/features/ai/chatHistory';
import { computeKeywordCoverage } from '@/features/ai/keywords';
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
  const [translateId, setTranslateId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [atsId, setAtsId] = useState<string | null>(null);
  const [chat, setChat] = useState<{ cvId: string; initial: string } | null>(null);
  const [showTailor, setShowTailor] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [pdfImport, setPdfImport] = useState<PdfImportState | null>(null);
  const pdfImportRunRef = useRef(0);
  const { modal, message, notification } = AntdApp.useApp();
  const aiSettings = useAISettings();
  const history = useCVHistory();
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
      onOk: () => {
        deleteCV(id);
        history.removeFor(id);
        removeChatFor(id);
      },
    });
  };

  const handleRequestClear = () => {
    modal.confirm({
      title: t('modal.clearData'),
      content: t('modal.clearMessage'),
      okText: t('modal.clear'),
      okButtonProps: { danger: true },
      cancelText: t('modal.cancel'),
      onOk: () => {
        clearAll();
        history.replaceAll([]);
        clearChats();
      },
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
    const json = JSON.stringify(createBackup(cvs, activeId, history.entries), null, 2);
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
    const merged = mergeImportedCVs(cvs, pendingRestore.cvs, t('backup.restoredSuffix'));
    importCVs(merged, activeId);
    history.mergeImported(pendingRestore.history, restoredIdMap(pendingRestore.cvs, merged));
    showNotice('success', t('backup.added', { count: pendingRestore.cvs.length }));
    setPendingRestore(null);
  };

  const handleRestoreReplace = () => {
    if (!pendingRestore) return;
    importCVs(pendingRestore.cvs, pendingRestore.activeId);
    const restoredIds = new Set(pendingRestore.cvs.map((cv) => cv.id));
    history.replaceAll(pendingRestore.history.filter((entry) => restoredIds.has(entry.cvId)));
    keepChatsFor(restoredIds);
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

  const updateActive = (changes: Partial<SavedCV>) => {
    if (activeId) updateCV(activeId, changes);
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

  const handleSaveTranslated = (cv: Omit<SavedCV, 'id' | 'updatedAt'>, record: HistoryRecord) => {
    history.record(addCV(cv), record, aiSettings.settings.model);
    showNotice('success', t('ai.translate.saved', { title: cv.title }));
  };

  const handleRestoreVersion = (entry: HistoryEntry) => {
    const cv = cvs.find((item) => item.id === entry.cvId);
    if (!cv) return;
    history.record(cv.id, { kind: 'restore', before: contentOf(cv), after: structuredClone(entry.after), changes: [] });
    updateCV(cv.id, structuredClone(entry.after));
    const date = new Date(entry.createdAt).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' });
    showNotice('success', t('history.restored', { date }));
  };

  const atsCV = cvs.find((cv) => cv.id === atsId) ?? null;

  const handleAtsAutoFix = (next: CVData, changes: string[]) => {
    if (!atsCV) return;
    history.record(atsCV.id, { kind: 'ats', before: contentOf(atsCV), after: contentOf(next), changes });
    updateCV(atsCV.id, {
      ...contentOf(next),
      linkedinName: next.linkedinName,
      githubName: next.githubName,
      portfolioName: next.portfolioName,
    });
    showNotice('success', t('ats.autoFixed', { count: changes.length, title: atsCV.title }));
  };

  const chatCV = cvs.find((cv) => cv.id === chat?.cvId) ?? null;
  const chatTailorEntry = chatCV ? entriesFor(history.entries, chatCV.id).find((entry) => entry.kind === 'tailor') : undefined;
  const chatJob = chatTailorEntry?.job
    ? {
        title: [chatTailorEntry.job.analysis.jobTitle, chatTailorEntry.job.analysis.company].filter(Boolean).join(' — '),
        text: chatTailorEntry.job.text,
      }
    : null;

  const chatMissingKeywords = chatCV
    ? computeKeywordCoverage(
        chatCV,
        (chatTailorEntry?.job?.missingKeywords ?? []).map((term) => ({ term, category: 'other', priority: 'high' })),
      )
        .filter((keyword) => keyword.count === 0)
        .map((keyword) => keyword.term)
    : [];

  const addFacts = (cv: SavedCV | null | undefined, facts: string[]) => {
    if (!cv) return;
    const declaredFacts = [...new Set([...(cv.meta?.declaredFacts ?? []), ...facts])];
    updateCV(cv.id, { meta: { ...cv.meta, declaredFacts } });
  };

  const handleApplyChat = (next: ResumeContent, request: string, reply: string) => {
    if (!chatCV) return;
    history.record(
      chatCV.id,
      { kind: 'chat', before: contentOf(chatCV), after: structuredClone(next), changes: reply ? [reply] : [], request },
      aiSettings.settings.model,
    );
    updateCV(chatCV.id, structuredClone(next));
    showNotice('success', t('chat.appliedNotice', { title: chatCV.title }));
  };

  const aiActionsProps: AIActionsProps = {
    onTailor: () => setShowTailor(true),
    onChat: () => {
      if (activeId) setChat({ cvId: activeId, initial: '' });
    },
    onTranslate: () => setTranslateId(activeId),
    onHistory: () => setHistoryId(activeId),
    onAts: () => setAtsId(activeId),
    translateTo: otherLocale(contentLocaleOf(activeCV ?? {}, i18n.language)),
  };

  const handleSaveTailored = (cv: Omit<SavedCV, 'id' | 'updatedAt'>, record: HistoryRecord) => {
    history.record(addCV(cv), record, aiSettings.settings.model);
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
        onShowHistory={(id) => {
          setHistoryId(id);
          closeSidebarIfOverlay();
        }}
        onTranslate={(id) => {
          setTranslateId(id);
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

        <TranslateModal
          cv={showAISettings ? null : (cvs.find((cv) => cv.id === translateId) ?? null)}
          settings={aiSettings.settings}
          isConfigured={aiSettings.isConfigured}
          onOpenSettings={() => setShowAISettings(true)}
          onClose={() => setTranslateId(null)}
          onSave={handleSaveTranslated}
        />

        <AtsDrawer
          cv={atsCV}
          onClose={() => setAtsId(null)}
          onAutoFix={handleAtsAutoFix}
          onFixWithAI={(message) => {
            if (atsCV) setChat({ cvId: atsCV.id, initial: message });
            setAtsId(null);
          }}
        />

        <HistoryDrawer
          cv={cvs.find((cv) => cv.id === historyId) ?? null}
          entries={historyId ? entriesFor(history.entries, historyId) : []}
          onClose={() => setHistoryId(null)}
          onRestore={handleRestoreVersion}
          onAskChat={(skill) => {
            if (historyId) setChat({ cvId: historyId, initial: t('chat.haveSkillMessage', { skill }) });
            setHistoryId(null);
          }}
        />

        <RefineChatDrawer
          cv={chatCV}
          baseCV={cvs.find((cv) => cv.id === chatCV?.meta?.sourceCvId) ?? null}
          job={chatJob}
          missingKeywords={chatMissingKeywords}
          initialMessage={chat?.initial ?? ''}
          settings={aiSettings.settings}
          isConfigured={aiSettings.isConfigured}
          onOpenSettings={() => setShowAISettings(true)}
          onApply={handleApplyChat}
          onFacts={(facts) => addFacts(chatCV, facts)}
          onAddFactsToBase={(facts) => {
            const base = cvs.find((cv) => cv.id === chatCV?.meta?.sourceCvId);
            addFacts(base, facts);
            if (base) showNotice('success', t('chat.factsAdded', { title: base.title }));
          }}
          onClose={() => setChat(null)}
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
          aiActions={<AIActions {...aiActionsProps} size="large" />}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 mx-auto w-full p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div className="md:hidden">
                <AIActions {...aiActionsProps} size="large" block />
              </div>
              <h2 className="text-xl font-semibold text-gray-700">
                {t('header.edit')}
              </h2>
              <div key={activeId}>
                <DocumentSettings
                  title={activeCV?.title ?? 'Novo Currículo'}
                  locale={detectResumeLocale(activeCV ?? {}, i18n.language)}
                  contentLocale={activeCV ? guessResumeLocale(activeCV) : null}
                  onRename={(title) => updateActive({ title })}
                  onLocaleChange={(locale) => updateActive({ locale })}
                  onTranslate={() => setTranslateId(activeId)}
                />

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
