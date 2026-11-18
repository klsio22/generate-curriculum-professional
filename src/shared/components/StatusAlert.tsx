import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export type StatusTone = 'success' | 'error' | 'info' | 'busy';

interface StatusAlertProps {
  tone: StatusTone;
  children: ReactNode;
  /** Technical text (e.g. the provider's message), hidden under "Technical details". */
  detail?: string;
  className?: string;
}

const TONE: Record<StatusTone, { box: string; icon: typeof Info; iconClass: string }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2, iconClass: 'text-emerald-600' },
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: AlertCircle, iconClass: 'text-red-600' },
  info: { box: 'border-indigo-200 bg-indigo-50 text-indigo-900', icon: Info, iconClass: 'text-indigo-600' },
  busy: { box: 'border-gray-200 bg-gray-50 text-gray-700', icon: Loader2, iconClass: 'animate-spin text-gray-500' },
};

/**
 * Banner for the result of an action. Place it inside a live region
 * (role="status" or role="alert") so screen readers announce it.
 */
export const StatusAlert = ({ tone, children, detail, className = '' }: StatusAlertProps) => {
  const { t } = useTranslation();
  const { box, icon: Icon, iconClass } = TONE[tone];
  return (
    <div className={`flex gap-3 rounded-md border p-3 text-sm ${box} ${className}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconClass}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{children}</p>
        {detail && (
          <details className="mt-1 text-xs opacity-80">
            <summary className="cursor-pointer select-none">{t('status.technicalDetails')}</summary>
            <p className="mt-1 break-words font-mono">{detail}</p>
          </details>
        )}
      </div>
    </div>
  );
};
