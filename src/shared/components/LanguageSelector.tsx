import { useTranslation } from 'react-i18next';
import { Segmented } from 'antd';

const LANGUAGES = [
  { value: 'pt-BR', short: 'PT', nameKey: 'language.pt' },
  { value: 'en', short: 'EN', nameKey: 'language.en' },
] as const;

/** PT / EN switch; the choice is kept for the next visit. */
export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  return (
    <Segmented
      size="small"
      aria-label={t('language.label')}
      value={i18n.language === 'en' ? 'en' : 'pt-BR'}
      onChange={(language) => {
        // The texts are already loaded, so there is nothing to wait for.
        void i18n.changeLanguage(language);
        localStorage.setItem('language', language);
      }}
      options={LANGUAGES.map((language) => ({
        value: language.value,
        title: t(language.nameKey),
        label: (
          <span lang={language.value} aria-label={t(language.nameKey)}>
            {language.short}
          </span>
        ),
      }))}
    />
  );
};
