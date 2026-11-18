import { useState } from 'react';
import { Printer, Settings, Sparkles } from 'lucide-react';
import { Badge, Button, type ButtonProps } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { downloadResumePdf } from '@/features/pdf/downloadPdf';
import { buildPdfFileName } from '@/features/pdf/pdfMetadata';
import { LanguageSelector } from '@/shared/components/LanguageSelector';
import { BackupMenu } from '@/features/backup/BackupMenu';

interface AppHeaderProps {
  data: CVData;
  activeTitle: string;
  onRestoreFile: (file: File) => void;
  onImportPdf: (file: File) => void;
  onSaveBackup: () => void;
  onDownloadError: () => void;
  onOpenAISettings: () => void;
  onOpenTailor: () => void;
  isAIConfigured: boolean;
}

type SizeType = ButtonProps['size'];

export const AppHeader = ({
  data,
  activeTitle,
  onRestoreFile,
  onImportPdf,
  onSaveBackup,
  onDownloadError,
  onOpenAISettings,
  onOpenTailor,
  isAIConfigured,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResumePdf(data, buildPdfFileName(data, activeTitle));
    } catch {
      onDownloadError();
    } finally {
      setDownloading(false);
    }
  };

  const tailorButton = (size: SizeType) => (
    <Button color="purple" variant="solid" size={size} icon={<Sparkles size={16} aria-hidden />} onClick={onOpenTailor}>
      {t('ai.tailor.open')}
    </Button>
  );

  const aiSettingsButton = (size: SizeType) => (
    <Badge dot={isAIConfigured} color="green" offset={[-4, 4]}>
      <Button
        size={size}
        icon={<Settings size={16} aria-hidden />}
        onClick={onOpenAISettings}
        aria-label={isAIConfigured ? t('header.aiSettingsConfigured') : t('header.aiSettings')}
      >
        {t('header.aiSettings')}
      </Button>
    </Badge>
  );

  const downloadButton = (size: SizeType) => (
    <Button type="primary" size={size} loading={downloading} icon={<Printer size={16} aria-hidden />} onClick={handleDownload}>
      {t('header.download')}
    </Button>
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
          {tailorButton('large')}
          {aiSettingsButton('large')}
          <BackupMenu onSaveBackup={onSaveBackup} onRestoreFile={onRestoreFile} onImportPdf={onImportPdf} size="large" />
          {downloadButton('large')}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-3 md:hidden flex flex-wrap gap-2 justify-center items-center">
        {tailorButton('middle')}
        {aiSettingsButton('middle')}
        <BackupMenu onSaveBackup={onSaveBackup} onRestoreFile={onRestoreFile} onImportPdf={onImportPdf} size="middle" />
        {downloadButton('middle')}
      </div>
    </header>
  );
};
