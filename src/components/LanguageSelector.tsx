import { useTranslation } from 'react-i18next';

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleLanguageChange('pt-BR')}
        aria-label="Português"
        title={t('language.pt')}
        className={`px-2 py-1 rounded text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
          i18n.language === 'pt-BR'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        PT
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        aria-label="English"
        title={t('language.en')}
        className={`px-2 py-1 rounded text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
          i18n.language === 'en'
            ? 'bg-indigo-600 text-white'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        EN
      </button>
    </div>
  );
};
