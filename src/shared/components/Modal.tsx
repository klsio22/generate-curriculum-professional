import * as React from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border ring-1 ring-black/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              aria-label="Fechar modal"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="p-6 text-sm text-gray-700">{children}</div>

          <div className="px-6 pb-6 pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return modalContent;
};

export default Modal;
