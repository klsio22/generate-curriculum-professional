import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Button, type ButtonProps } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { downloadResumePdf } from './downloadPdf';
import { buildPdfFileName } from './pdfMetadata';

interface DownloadPdfButtonProps {
  data: CVData;
  activeTitle: string;
  onError: () => void;
  size?: ButtonProps['size'];
  block?: boolean;
}

export const DownloadPdfButton = ({ data, activeTitle, onError, size, block }: DownloadPdfButtonProps) => {
  const { t } = useTranslation();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResumePdf(data, buildPdfFileName(data, activeTitle));
    } catch {
      onError();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      type="primary"
      size={size}
      block={block}
      loading={downloading}
      icon={<Printer size={16} aria-hidden />}
      onClick={handleDownload}
    >
      {t('header.download')}
    </Button>
  );
};
