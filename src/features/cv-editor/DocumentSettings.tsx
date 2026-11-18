import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Form, Input, Select } from 'antd';
import { Languages } from 'lucide-react';
import type { ResumeLocale } from '@/types/cv';
import { RESUME_LOCALES } from '@/shared/locale';
import { LocaleFlag } from '@/shared/components/LocaleFlag';

interface DocumentSettingsProps {
  title: string;
  locale: ResumeLocale;
  contentLocale: ResumeLocale | null;
  onRename: (title: string) => void;
  onLocaleChange: (locale: ResumeLocale) => void;
  onTranslate: () => void;
}

const LOCALE_NAME_KEY: Record<ResumeLocale, string> = { 'pt-BR': 'language.pt', en: 'language.en' };
const LOCALE_TEXT_KEY: Record<ResumeLocale, string> = { 'pt-BR': 'ai.translate.language_pt', en: 'ai.translate.language_en' };

export const DocumentSettings = ({
  title,
  locale,
  contentLocale,
  onRename,
  onLocaleChange,
  onTranslate,
}: DocumentSettingsProps) => {
  const { t } = useTranslation();
  const showMismatch = contentLocale !== null && contentLocale !== locale;

  return (
    <Card className="mb-4 shadow-sm">
      <Form layout="vertical" component={false}>
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_180px]">
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
              className="w-full"
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
      {showMismatch && (
        <Alert
          type="info"
          showIcon
          className="mt-4 items-start [&_.ant-alert-icon]:mt-1"
          title={
            <div className="flex flex-col gap-2">
              <span>
                {t('form.localeMismatch', {
                  content: t(LOCALE_TEXT_KEY[contentLocale]),
                  chosen: t(LOCALE_TEXT_KEY[locale]),
                })}
              </span>
              <span className="flex flex-wrap gap-2">
                <Button type="primary" size="small" icon={<Languages size={14} aria-hidden />} onClick={onTranslate}>
                  {t('form.translateContent', { language: t(LOCALE_TEXT_KEY[locale]) })}
                </Button>
                <Button size="small" onClick={() => onLocaleChange(contentLocale)}>
                  {t('form.keepLocale', { language: t(LOCALE_TEXT_KEY[contentLocale]) })}
                </Button>
              </span>
            </div>
          }
        />
      )}
    </Card>
  );
};
