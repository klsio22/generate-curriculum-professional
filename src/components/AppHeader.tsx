import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Menu, Printer, Upload, X } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import type { CVData } from '../types';
import { CVDocument } from './CVDocument';
import { LanguageSelector } from './LanguageSelector';

interface AppHeaderProps {
  data: CVData;
  activeTitle: string;
  isPreviewVisible: boolean;
  onImportData: (event: ChangeEvent<HTMLInputElement>) => void;
  onExportData: () => void;
  onDownloadPdf: () => void;
  onTogglePreview: () => void;
}

export const AppHeader = ({
  data,
  activeTitle,
  isPreviewVisible,
  onImportData,
  onExportData,
  onDownloadPdf,
  onTogglePreview,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const triggerImport = () => {
    importInputRef.current?.click();
  };

  const handleImport = () => {
    triggerImport();
  };

  const handleExport = () => {
    onExportData();
  };

  const handleDownload = () => {
    onDownloadPdf();
  };

  const handleTogglePreview = () => {
    onTogglePreview();
  };

  return (
    <header className="bg-white shadow p-4 sticky top-0 z-10">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportData}
      />

      <div className="max-w-7xl mx-auto flex justify-between md:justify-between items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 md:ml-8 min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
            {t('header.title')}
          </h1>
          <LanguageSelector />
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          className="md:hidden inline-flex items-center gap-2 rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.menu')}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>{isMobileMenuOpen ? t('header.closeMenu') : t('header.menu')}</span>
        </button>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={handleImport}
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
                onClick={handleDownload}
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

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-72 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-3 border border-gray-200 shadow-sm w-10/12 mx-auto">
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-md hover:bg-gray-300 transition text-sm whitespace-nowrap"
          >
            <Upload size={16} />
            <span>{t('header.importData')}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition text-sm whitespace-nowrap"
          >
            <Download size={16} />
            <span>{t('header.exportData')}</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePreview}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-md hover:bg-gray-800 transition text-sm whitespace-nowrap"
          >
            <span>{isPreviewVisible ? t('header.hidePreview') : t('header.showPreview')}</span>
          </button>

          <PDFDownloadLink
            document={<CVDocument data={data} />}
            fileName={`${activeTitle.replaceAll(/\s+/g, '_')}.pdf`}
          >
            {({ loading }) => (
              <button
                disabled={loading}
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={16} />
                <span>{t('header.download')}</span>
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </header>
  );
};