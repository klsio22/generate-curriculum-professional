import { useTranslation } from 'react-i18next';
import { Segmented } from 'antd';
import { LocaleFlag } from './LocaleFlag';

const LANGUAGES = [
  { value: 'pt-BR', short: 'PT', nameKey: 'language.pt' },
  { value: 'en', short: 'EN', nameKey: 'language.en' },
] as const;

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  return (
    <Segmented
      shape="round"
      aria-label={t('language.label')}
      value={i18n.language === 'en' ? 'en' : 'pt-BR'}
      onChange={(language) => {
        void i18n.changeLanguage(language);
        localStorage.setItem('language', language);
      }}
      options={LANGUAGES.map(({ value, short, nameKey }) => ({
        value,
        title: t(nameKey),
        label: (
          <span lang={value} aria-label={t(nameKey)} className="inline-flex items-center gap-1.5 align-middle font-medium">
            <LocaleFlag locale={value} />
            <span className="hidden md:inline">{short}</span>
          </span>
        ),
      }))}
    />
  );
};
