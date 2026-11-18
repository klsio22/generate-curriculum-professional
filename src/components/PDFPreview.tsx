import { PDFViewer } from '@react-pdf/renderer';
import { useEffect, useState } from 'react';
import { CVDocument, type PDFPreviewProps } from './CVDocument';


export const PDFPreview = ({ data }: PDFPreviewProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const time = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(time);
  }, [data]);

  return (
    <div className="h-192 max-h-max border border-gray-200 rounded-lg overflow-hidden w-full">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <span className="loading loading-spinner loading-xl w-20" />
        </div>
      ) : (
        <PDFViewer style={{ width: '100%', height: '100%' }}>
          <CVDocument data={data} />
        </PDFViewer>
      )}
    </div>
  );
};
export default PDFPreview;
