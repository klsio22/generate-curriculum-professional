import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useDialogFocus } from './useDialogFocus';

type ModalSize = 'md' | 'lg' | 'xl';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  /** Visual style of the default confirm button. */
  confirmVariant?: 'danger' | 'primary';
  /** Custom footer. Pass `null` to hide the footer; omit it to get the default cancel/confirm buttons. */
  footer?: React.ReactNode;
  size?: ModalSize;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
  footer,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const titleId = React.useId();
  const panelRef = React.useRef<HTMLDivElement>(null);
  useDialogFocus(panelRef, isOpen, onCancel);

  if (!isOpen) return null;

  const confirmClass =
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-700'
      : 'bg-indigo-600 hover:bg-indigo-700 focus-visible:outline-indigo-700';

  const defaultFooter = (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
      >
        {cancelLabel ?? t('modal.cancel')}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className={`px-4 py-2 rounded-md text-white text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${confirmClass}`}
      >
        {confirmLabel ?? t('modal.confirm')}
      </button>
    </>
  );

  const footerContent = footer === undefined ? defaultFooter : footer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative z-10 w-full ${SIZE_CLASS[size]} mx-auto outline-none`}
      >
        <div className="bg-white rounded-xl shadow-2xl border ring-1 ring-black/5 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 id={titleId} className="text-lg font-semibold text-gray-800">
              {title}
            </h2>
            <button
              type="button"
              aria-label={t('modal.close')}
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="p-6 text-sm text-gray-700 overflow-y-auto">{children}</div>

          {footerContent !== null && (
            <div className="px-6 py-4 flex flex-wrap justify-end gap-3 border-t">
              {footerContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
