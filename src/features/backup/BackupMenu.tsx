import { cloneElement, isValidElement, useRef, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, theme, type ButtonProps, type MenuProps } from 'antd';
import { ArchiveRestore, ChevronDown, Download, FileText, HardDrive, Upload } from 'lucide-react';
import { useFocusReturn } from '@/shared/components/useFocusReturn';

interface BackupMenuProps {
  onSaveBackup: () => void;
  onRestoreFile: (file: File) => void;
  onImportPdf: (file: File) => void;
  size?: ButtonProps['size'];
}

type FileAction = 'restore' | 'importPdf';

const ACCEPT: Record<FileAction, string> = {
  restore: 'application/json,.json',
  importPdf: 'application/pdf,.pdf',
};

export const BackupMenu = ({ onSaveBackup, onRestoreFile, onImportPdf, size }: BackupMenuProps) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileActionRef = useRef<FileAction>('restore');
  const { token } = theme.useToken();
  const { triggerRef: menuTriggerRef, onOpenChange: onMenuOpenChange } = useFocusReturn();
  const panelStyle: CSSProperties = {
    background: token.colorBgElevated,
    borderRadius: token.borderRadiusLG,
    boxShadow: token.boxShadowSecondary,
  };

  const itemLabel = (title: string, help: string) => (
    <span className="block max-w-72 py-1">
      <span className="block font-medium">{title}</span>
      <span className="block text-xs text-gray-500 whitespace-normal">{help}</span>
    </span>
  );

  const pickFile = (action: FileAction) => {
    fileActionRef.current = action;
    if (!fileRef.current) return;
    fileRef.current.accept = ACCEPT[action];
    fileRef.current.click();
  };

  const items: MenuProps['items'] = [
    {
      key: 'save',
      icon: <Download size={18} className="text-emerald-700" aria-hidden />,
      label: itemLabel(t('backup.save'), t('backup.saveHelp')),
      onClick: onSaveBackup,
    },
    {
      key: 'restore',
      icon: <Upload size={18} className="text-indigo-700" aria-hidden />,
      label: itemLabel(t('backup.restore'), t('backup.restoreHelp')),
      onClick: () => pickFile('restore'),
    },
    {
      key: 'importPdf',
      icon: <FileText size={18} className="text-amber-700" aria-hidden />,
      label: itemLabel(t('pdfImport.menu'), t('pdfImport.menuHelp')),
      onClick: () => pickFile('importPdf'),
    },
  ];

  return (
    <>
      {/* eslint-disable-next-line no-restricted-syntax */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.restore}
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (fileActionRef.current === 'importPdf') onImportPdf(file);
          else onRestoreFile(file);
        }}
      />
      <Dropdown
        trigger={['click']}
        autoFocus
        onOpenChange={onMenuOpenChange}
        placement="bottomRight"
        menu={{ items }}
        popupRender={(menu) => (
          <div className="max-w-80" style={panelStyle}>
            <p className="px-4 pb-1 pt-3 text-sm text-gray-600">{t('backup.intro')}</p>
            {isValidElement(menu)
              ? cloneElement(menu as ReactElement<{ style?: CSSProperties }>, { style: { boxShadow: 'none' } })
              : menu}
            <p className="flex gap-2 px-4 pb-3 pt-1 text-xs text-gray-500">
              <ArchiveRestore size={14} className="mt-0.5 shrink-0" aria-hidden />
              {t('backup.fileHint')}
            </p>
          </div>
        )}
      >
        <Button ref={menuTriggerRef} size={size} icon={<HardDrive size={16} aria-hidden />}>
          {t('backup.menu')}
          <ChevronDown size={14} aria-hidden />
        </Button>
      </Dropdown>
    </>
  );
};
