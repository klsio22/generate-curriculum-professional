import { cloneElement, isValidElement, useRef, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, theme, type ButtonProps, type MenuProps } from 'antd';
import { ArchiveRestore, ChevronDown, Download, HardDrive, Upload } from 'lucide-react';
import { useFocusReturn } from '@/shared/components/useFocusReturn';

interface BackupMenuProps {
  onSaveBackup: () => void;
  onRestoreFile: (file: File) => void;
  size?: ButtonProps['size'];
}

/**
 * "Backup" button that opens a menu explaining what a backup is, with
 * "Save backup" and "Restore backup" (antd Dropdown: arrows, Enter, Escape).
 */
export const BackupMenu = ({ onSaveBackup, onRestoreFile, size }: BackupMenuProps) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
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
      onClick: () => fileRef.current?.click(),
    },
  ];

  return (
    <>
      {/* The native file picker has no antd equivalent that a menu item can open. */}
      {/* eslint-disable-next-line no-restricted-syntax */}
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
      <Dropdown
        trigger={['click']}
        autoFocus
        onOpenChange={onMenuOpenChange}
        placement="bottomRight"
        menu={{ items }}
        popupRender={(menu) => (
          <div className="max-w-80" style={panelStyle}>
            <p className="px-4 pb-1 pt-3 text-sm text-gray-600">{t('backup.intro')}</p>
            {/* The panel already has the shadow. */}
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
