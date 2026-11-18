import { useTranslation } from 'react-i18next';
import { Segmented } from 'antd';

const US_STRIPES = [0, 2, 4, 6, 8, 10, 12];
const US_STRIPE_HEIGHT = 20 / 13;

const BrazilFlag = () => (
  <svg viewBox="0 0 20 20" className="block size-full" aria-hidden>
    <rect width="20" height="20" fill="#009c3b" />
    <path d="M10 3.5 18 10l-8 6.5L2 10z" fill="#ffdf00" />
    <circle cx="10" cy="10" r="4.2" fill="#002776" />
  </svg>
);

const UsFlag = () => (
  <svg viewBox="0 0 20 20" className="block size-full" aria-hidden>
    <rect width="20" height="20" fill="#ffffff" />
    {US_STRIPES.map((index) => (
      <rect key={index} y={index * US_STRIPE_HEIGHT} width="20" height={US_STRIPE_HEIGHT} fill="#b22234" />
    ))}
    <rect width="10" height={7 * US_STRIPE_HEIGHT} fill="#3c3b6e" />
  </svg>
);

const LANGUAGES = [
  { value: 'pt-BR', short: 'PT', nameKey: 'language.pt', Flag: BrazilFlag },
  { value: 'en', short: 'EN', nameKey: 'language.en', Flag: UsFlag },
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
      options={LANGUAGES.map(({ value, short, nameKey, Flag }) => ({
        value,
        title: t(nameKey),
        label: (
          <span lang={value} aria-label={t(nameKey)} className="inline-flex items-center gap-1.5 align-middle font-medium">
            <span className="size-4 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
              <Flag />
            </span>
            <span className="hidden md:inline">{short}</span>
          </span>
        ),
      }))}
    />
  );
};
