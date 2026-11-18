import { pdf } from '@react-pdf/renderer';
import type { CVData } from '@/types/cv';
import { CVDocument } from './CVDocument';

export const downloadResumePdf = async (data: CVData, fileName: string) => {
  const blob = await pdf(<CVDocument data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
