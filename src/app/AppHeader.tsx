import { useRef, type ChangeEvent } from 'react';
import { Download, Printer, Settings, Upload } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { CVDocument } from '@/features/pdf/CVDocument';
import { LanguageSelector } from '@/shared/components/LanguageSelector';

interface AppHeaderProps {
  data: CVData;
  activeTitle: string;
  onImportData: (event: ChangeEvent<HTMLInputElement>) => void;
  onExportData: () => void;
  onDownloadPdf: () => void;
  onOpenAISettings: () => void;
  isAIConfigured: boolean;
}

export const AppHeader = ({
  data,
  activeTitle,
  onImportData,
  onExportData,
  onDownloadPdf,
  onOpenAISettings,
  isAIConfigured,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  const importInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = () => {
    importInputRef.current?.click();
  };

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

  return (
    <header className="bg-white shadow p-4 sticky top-0 z-10">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportData}
      />

      <div className="max-w-7xl mx-auto flex justify-center md:justify-between items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
            {t('header.title')}
          </h1>
          <LanguageSelector />
        </div>

        <div className="hidden md:flex items-center gap-2">
          {aiSettingsButton(18, 'px-3 py-2 md:px-4 md:py-2 text-sm md:text-base')}

          <button
            type="button"
            onClick={triggerImport}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-gray-300 transition text-sm md:text-base whitespace-nowrap"
          >
            <Upload size={18} />
            <span>{t('header.importData')}</span>
          </button>

          <button
            type="button"
            onClick={onExportData}
            className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-emerald-700 transition text-sm md:text-base whitespace-nowrap"
          >
            <Download size={18} />
            <span>{t('header.exportData')}</span>
          </button>

          <PDFDownloadLink
            document={<CVDocument data={data} />}
            fileName={`${activeTitle.replaceAll(/\s+/g, '_')}.pdf`}
          >
            {({ loading }) => (
              <button
                disabled={loading}
                onClick={onDownloadPdf}
                className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-indigo-700 transition text-sm md:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={20} />
                <span className="hidden md:inline">{t('header.download')}</span>
                <span className="md:hidden">{t('header.downloadMobile')}</span>
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-3 md:hidden flex flex-wrap gap-2 justify-center items-center">
        {aiSettingsButton(16, 'px-3 py-2 text-sm')}

        <button
          type="button"
          onClick={triggerImport}
          className="flex items-center gap-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition text-sm whitespace-nowrap"
        >
          <Upload size={16} />
          <span>{t('header.importData')}</span>
        </button>

        <button
          type="button"
          onClick={onExportData}
          className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition text-sm whitespace-nowrap"
        >
          <Download size={16} />
          <span>{t('header.exportData')}</span>
        </button>

        <PDFDownloadLink
          document={<CVDocument data={data} />}
          fileName={`${activeTitle.replaceAll(/\s+/g, '_')}.pdf`}
        >
          {({ loading }) => (
            <button
              disabled={loading}
              onClick={onDownloadPdf}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              <span>{t('header.download')}</span>
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </header>
  );
};