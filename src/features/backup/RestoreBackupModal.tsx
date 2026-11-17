import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/components/Modal';
import type { ParsedBackup } from './backup';

interface RestoreBackupModalProps {
  backup: ParsedBackup | null;
  currentCount: number;
  onAdd: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

const MAX_LISTED = 8;

export const RestoreBackupModal = ({ backup, currentCount, onAdd, onReplace, onCancel }: RestoreBackupModalProps) => {
  const { t, i18n } = useTranslation();
  if (!backup) return null;

  const exportedAt = backup.exportedAt ? new Date(backup.exportedAt) : null;
  const dateText =
    exportedAt && !Number.isNaN(exportedAt.getTime())
      ? exportedAt.toLocaleString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', {
          dateStyle: 'long',
          timeStyle: 'short',
        })
      : null;

  const footer = (
    <>
      <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700">
        {t('modal.cancel')}
      </button>
      <button
        type="button"
        onClick={onReplace}
        className="px-4 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-sm"
      >
        {t('backup.replaceAll')}
      </button>
      <button
        type="button"
        data-autofocus
        onClick={onAdd}
        className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
      >
        {t('backup.addToMine')}
      </button>
    </>
  );

  return (
    <Modal isOpen title={t('backup.restoreTitle')} onCancel={onCancel} footer={footer} size="lg">
      <div className="space-y-4">
        <p>
          {t('backup.fileContains', { count: backup.cvs.length })}
          {dateText && <> {t('backup.savedOn', { date: dateText })}</>}
        </p>

        <ul className="list-disc space-y-1 pl-5 text-gray-800">
          {backup.cvs.slice(0, MAX_LISTED).map((cv) => (
            <li key={cv.id}>{cv.title}</li>
          ))}
          {backup.cvs.length > MAX_LISTED && (
            <li className="list-none text-gray-500">{t('backup.andMore', { count: backup.cvs.length - MAX_LISTED })}</li>
          )}
        </ul>

        <div className="space-y-2 rounded-md bg-gray-50 p-3">
          <p>
            <strong>{t('backup.addToMine')}:</strong> {t('backup.addHelp')}
          </p>
          <p>
            <strong className="text-red-700">{t('backup.replaceAll')}:</strong>{' '}
            {t('backup.replaceHelp', { count: currentCount })}
          </p>
        </div>
      </div>
    </Modal>
  );
};
