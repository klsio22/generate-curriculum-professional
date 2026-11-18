import { useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';

interface DrawerProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons kept at the bottom of the panel, always visible. */
  footer?: ReactNode;
}

/**
 * Side panel that slides in from the right. The page stays visible behind a
 * light overlay, so it feels like part of the workspace rather than a pop-up.
 * Same keyboard behavior as Modal: focus inside, Tab trapped, Escape closes.
 *
 * The slide-in is a CSS animation without `fill-mode`, so no `transform` stays
 * on the panel afterwards: `position: fixed` children (such as the model list)
 * keep using the page as reference.
 */
export const Drawer = ({ isOpen, title, onClose, children, footer }: DrawerProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  useDialogFocus(panelRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-gray-900/20 motion-safe:animate-[drawer-fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl outline-none sm:w-[480px] sm:border-l sm:border-gray-200 motion-safe:animate-[drawer-slide-in_200ms_ease-out]"
      >
        <header className="flex items-center justify-between border-b px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <button
            type="button"
            aria-label={t('modal.close')}
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 text-sm text-gray-700">{children}</div>

        {footer && (
          <footer className="flex justify-end gap-2 border-t bg-gray-50 px-6 py-4">{footer}</footer>
        )}
      </aside>
    </div>
  );
};
