import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArchiveRestore, ChevronDown, Download, HardDrive, Upload } from 'lucide-react';

interface BackupMenuProps {
  onSaveBackup: () => void;
  onRestoreFile: (file: File) => void;
  /** Extra classes for the trigger button (sizes differ between desktop and mobile). */
  buttonClassName?: string;
  iconSize?: number;
}

/**
 * "Backup" button that opens a small panel explaining what a backup is,
 * with "Save backup" and "Restore backup" actions (disclosure pattern).
 */
export const BackupMenu = ({ onSaveBackup, onRestoreFile, buttonClassName = '', iconSize = 18 }: BackupMenuProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ids = { panel: useId(), intro: useId(), saveHelp: useId(), restoreHelp: useId() };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemClass =
    'flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-gray-100 focus-visible:bg-gray-100';

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onRestoreFile(file);
        }}
      />

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={ids.panel}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition whitespace-nowrap ${buttonClassName}`}
      >
        <HardDrive size={iconSize} aria-hidden />
        <span>{t('backup.menu')}</span>
        <ChevronDown size={16} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={ids.panel}
          className="z-20 mt-2 rounded-lg border border-gray-200 bg-white p-2 text-sm shadow-xl max-md:fixed max-md:inset-x-4 md:absolute md:right-0 md:w-80"
        >
          <p id={ids.intro} className="px-3 pb-2 pt-1 text-gray-600">
            {t('backup.intro')}
          </p>

          <button
            type="button"
            aria-describedby={ids.saveHelp}
            onClick={() => {
              setOpen(false);
              onSaveBackup();
            }}
            className={itemClass}
          >
            <Download size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden />
            <span>
              <span className="block font-medium text-gray-900">{t('backup.save')}</span>
              <span id={ids.saveHelp} className="block text-gray-600">{t('backup.saveHelp')}</span>
            </span>
          </button>

          <button
            type="button"
            aria-describedby={ids.restoreHelp}
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
            className={itemClass}
          >
            <Upload size={18} className="mt-0.5 shrink-0 text-indigo-700" aria-hidden />
            <span>
              <span className="block font-medium text-gray-900">{t('backup.restore')}</span>
              <span id={ids.restoreHelp} className="block text-gray-600">{t('backup.restoreHelp')}</span>
            </span>
          </button>

          <p className="flex gap-2 px-3 pb-1 pt-2 text-xs text-gray-500">
            <ArchiveRestore size={14} className="mt-0.5 shrink-0" aria-hidden />
            {t('backup.fileHint')}
          </p>
        </div>
      )}
    </div>
  );
};
