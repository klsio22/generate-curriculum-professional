import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PDFViewer } from '@react-pdf/renderer';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { CVDocument, type PDFPreviewProps } from './CVDocument';

const PREVIEW_DELAY_MS = 400;

export const PDFPreview = memo(({ data }: PDFPreviewProps) => {
  const { i18n } = useTranslation();
  const previewData = useDebouncedValue(data, PREVIEW_DELAY_MS);
  const document = useMemo(
    () => <CVDocument data={previewData} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewData, i18n.language],
  );

  return (
    <div className="h-192 max-h-max border border-gray-200 rounded-lg overflow-hidden w-full">
      <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%' }}>{document}</PDFViewer>
    </div>
  );
});
PDFPreview.displayName = 'PDFPreview';

export default PDFPreview;
