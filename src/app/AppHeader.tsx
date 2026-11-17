import { Printer, Settings, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { CVDocument } from '@/features/pdf/CVDocument';
import { buildPdfFileName } from '@/features/pdf/pdfMetadata';
import { LanguageSelector } from '@/shared/components/LanguageSelector';
import { BackupMenu } from '@/features/backup/BackupMenu';

interface AppHeaderProps {
  data: CVData;
  activeTitle: string;
  onRestoreFile: (file: File) => void;
  onSaveBackup: () => void;
  onDownloadPdf: () => void;
  onOpenAISettings: () => void;
  onOpenTailor: () => void;
  isAIConfigured: boolean;
}

export const AppHeader = ({
  data,
  activeTitle,
  onRestoreFile,
  onSaveBackup,
  onDownloadPdf,
  onOpenAISettings,
  onOpenTailor,
  isAIConfigured,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  const pdfFileName = buildPdfFileName(data, activeTitle);

  const tailorButton = (iconSize: number, extraClass: string) => (
    <button
      type="button"
      onClick={onOpenTailor}
      className={`flex items-center gap-2 bg-violet-700 text-white rounded-md hover:bg-violet-800 transition whitespace-nowrap ${extraClass}`}
    >
      <Sparkles size={iconSize} aria-hidden />
      <span>{t('ai.tailor.open')}</span>
    </button>
  );

  const aiSettingsButton = (iconSize: number, extraClass: string) => (
    <button
      type="button"
      onClick={onOpenAISettings}
      aria-label={isAIConfigured ? t('header.aiSettingsConfigured') : t('header.aiSettings')}
      className={`relative flex items-center gap-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition whitespace-nowrap ${extraClass}`}
    >
      <Settings size={iconSize} aria-hidden />
      <span>{t('header.aiSettings')}</span>
      {isAIConfigured && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" aria-hidden />
      )}
    </button>
  );

  const downloadButton = (iconSize: number, extraClass: string, label: ReactNode) => (
    <PDFDownloadLink document={<CVDocument data={data} />} fileName={pdfFileName}>
      {({ loading }) => (
        <button
          type="button"
          disabled={loading}
          onClick={onDownloadPdf}
          className={`flex items-center gap-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${extraClass}`}
        >
          <Printer size={iconSize} aria-hidden />
          {label}
        </button>
      )}
    </PDFDownloadLink>
  );

  return (
    <header className="bg-white shadow p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-center md:justify-between items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
            {t('header.title')}
          </h1>
          <LanguageSelector />
        </div>

        <div className="hidden md:flex items-center gap-2">
          {tailorButton(18, 'px-4 py-2 text-base')}
          {aiSettingsButton(18, 'px-4 py-2 text-base')}
          <BackupMenu
            onSaveBackup={onSaveBackup}
            onRestoreFile={onRestoreFile}
            buttonClassName="px-4 py-2 text-base"
          />
          {downloadButton(20, 'px-4 py-2 text-base', <span>{t('header.download')}</span>)}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-3 md:hidden flex flex-wrap gap-2 justify-center items-center">
        {tailorButton(16, 'px-3 py-2 text-sm')}
        {aiSettingsButton(16, 'px-3 py-2 text-sm')}
        <BackupMenu
          onSaveBackup={onSaveBackup}
          onRestoreFile={onRestoreFile}
          buttonClassName="px-3 py-2 text-sm"
          iconSize={16}
        />
        {downloadButton(16, 'px-3 py-2 text-sm', <span>{t('header.download')}</span>)}
      </div>
    </header>
  );
};
