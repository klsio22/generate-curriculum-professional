import { useTranslation } from 'react-i18next';
import { Card, Form, Input, Select } from 'antd';
import type { ResumeLocale } from '@/types/cv';
import { RESUME_LOCALES } from '@/shared/locale';
import { LocaleFlag } from '@/shared/components/LocaleFlag';

interface DocumentSettingsProps {
  title: string;
  locale: ResumeLocale;
  onRename: (title: string) => void;
  onLocaleChange: (locale: ResumeLocale) => void;
}

const LOCALE_NAME_KEY: Record<ResumeLocale, string> = { 'pt-BR': 'language.pt', en: 'language.en' };

export const DocumentSettings = ({ title, locale, onRename, onLocaleChange }: DocumentSettingsProps) => {
  const { t } = useTranslation();

  return (
    <Card className="mb-4 shadow-sm">
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
          <Form.Item label={t('form.docName')} htmlFor="cv-document-title" className="mb-0">
            <Input
              key={title}
              id="cv-document-title"
              defaultValue={title}
              onBlur={(event) => onRename(event.target.value)}
              placeholder={t('form.docNamePlaceholder')}
            />
          </Form.Item>
          <Form.Item label={t('form.resumeLanguage')} htmlFor="cv-document-locale" className="mb-0">
            <Select
              id="cv-document-locale"
              value={locale}
              onChange={onLocaleChange}
              className="w-full sm:w-44"
              options={RESUME_LOCALES.map((value) => ({
                value,
                label: (
                  <span lang={value} className="inline-flex items-center gap-2 align-middle">
                    <LocaleFlag locale={value} />
                    {t(LOCALE_NAME_KEY[value])}
                  </span>
                ),
              }))}
            />
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
};
