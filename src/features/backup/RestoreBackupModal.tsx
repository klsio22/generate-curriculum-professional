import { useTranslation } from 'react-i18next';
import { Alert, Button, Modal } from 'antd';
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
  const dateLocale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
  const dateText =
    exportedAt && !Number.isNaN(exportedAt.getTime())
      ? exportedAt.toLocaleString(dateLocale, {
          dateStyle: 'long',
          timeStyle: 'short',
        })
      : null;

  const footer = [
    <Button key="cancel" onClick={onCancel}>
      {t('modal.cancel')}
    </Button>,
    <Button key="replace" danger onClick={onReplace}>
      {t('backup.replaceAll')}
    </Button>,
    <Button key="add" type="primary" autoFocus onClick={onAdd}>
      {t('backup.addToMine')}
    </Button>,
  ];

  const listed = backup.cvs.slice(0, MAX_LISTED);

  return (
    <Modal open title={t('backup.restoreTitle')} onCancel={onCancel} footer={footer} width={640} destroyOnHidden>
      <div className="space-y-4">
        <p>
          {t('backup.fileContains', { count: backup.cvs.length })}
          {dateText && <> {t('backup.savedOn', { date: dateText })}</>}
        </p>

        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {listed.map((cv) => (
            <li key={cv.id} className="px-3 py-2 text-gray-800">
              {cv.title}
            </li>
          ))}
          {backup.cvs.length > MAX_LISTED && (
            <li className="px-3 py-2 text-gray-500">{t('backup.andMore', { count: backup.cvs.length - MAX_LISTED })}</li>
          )}
        </ul>

        <Alert
          type="info"
          description={
            <div className="space-y-2">
              <p>
                <strong>{t('backup.addToMine')}:</strong> {t('backup.addHelp')}
              </p>
              <p>
                <strong className="text-red-700">{t('backup.replaceAll')}:</strong>{' '}
                {t('backup.replaceHelp', { count: currentCount })}
              </p>
            </div>
          }
        />
      </div>
    </Modal>
  );
};
