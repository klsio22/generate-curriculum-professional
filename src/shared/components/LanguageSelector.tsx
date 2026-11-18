import { useTranslation } from 'react-i18next';
import { Button, Dropdown, type MenuProps } from 'antd';
import { ChevronDown, Globe } from 'lucide-react';
import { useFocusReturn } from './useFocusReturn';

const LANGUAGES = [
  { value: 'pt-BR', short: 'PT', nameKey: 'language.pt' },
  { value: 'en', short: 'EN', nameKey: 'language.en' },
] as const;

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const { triggerRef, onOpenChange } = useFocusReturn();
  const current = i18n.language === 'en' ? LANGUAGES[1] : LANGUAGES[0];
  const label = `${t('language.label')}: ${t(current.nameKey)}`;

  const items: MenuProps['items'] = LANGUAGES.map((language) => ({
    key: language.value,
    label: <span lang={language.value}>{t(language.nameKey)}</span>,
  }));

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      autoFocus
      onOpenChange={onOpenChange}
      menu={{
        items,
        selectable: true,
        selectedKeys: [current.value],
        onClick: ({ key }) => {
          void i18n.changeLanguage(key);
          localStorage.setItem('language', key);
        },
      }}
    >
      <Button
        ref={triggerRef}
        type="text"
        icon={<Globe size={16} aria-hidden />}
        aria-label={label}
        title={label}
        className="gap-1 px-2 text-gray-600"
      >
        <span aria-hidden>{current.short}</span>
        <ChevronDown size={12} aria-hidden />
      </Button>
    </Dropdown>
  );
};
