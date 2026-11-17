import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X, XCircle } from 'lucide-react';

export interface NoticeMessage {
  kind: 'success' | 'error';
  message: string;
  /** Changes on every notice so the same text can be shown twice in a row. */
  id: number;
}

interface NoticeProps {
  notice: NoticeMessage | null;
  onClose: () => void;
}

const AUTO_CLOSE_MS = 7000;

/**
 * Feedback banner that replaces window.alert(). The live regions are always in the
 * page so screen readers announce new messages: polite for success, assertive for errors.
 */
export const Notice = ({ notice, onClose }: NoticeProps) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (notice?.kind !== 'success') return;
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [notice, onClose]);

  const box = (current: NoticeMessage) => (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 text-sm shadow-lg ${
        current.kind === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-red-200 bg-red-50 text-red-900'
      }`}
    >
      {current.kind === 'success' ? (
        <CheckCircle2 size={20} className="shrink-0" aria-hidden />
      ) : (
        <XCircle size={20} className="shrink-0" aria-hidden />
      )}
      <p className="flex-1">{current.message}</p>
      <button type="button" onClick={onClose} aria-label={t('modal.close')} className="rounded p-0.5 hover:bg-black/5">
        <X size={16} aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 left-4 z-60 flex flex-col gap-2 md:left-auto md:w-96">
      <div role="status" aria-live="polite" className="w-full">
        {notice?.kind === 'success' && box(notice)}
      </div>
      <div role="alert" className="w-full empty:hidden">
        {notice?.kind === 'error' && box(notice)}
      </div>
    </div>
  );
};
