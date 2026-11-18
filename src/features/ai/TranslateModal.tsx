import { useEffect, useId, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import type { CVData, ResumeLocale, SavedCV } from '@/types/cv';
import { StatusAlert } from '@/shared/components/StatusAlert';
import { detectResumeLocale, otherLocale } from '@/shared/locale';
import { describeAIError, type AIErrorDescription } from './errorMessage';
import { ResumeComparison, type Comparison } from './ResumeComparison';
import { translateResume, type TranslateResult } from './translation';
import type { AISettings } from './types';

interface TranslateDialogProps {
  cv: SavedCV;
  settings: AISettings;
  isConfigured: boolean;
  onOpenSettings: () => void;
  onClose: () => void;
  onSave: (cv: Omit<SavedCV, 'id' | 'updatedAt'>) => void;
}

interface TranslateModalProps extends Omit<TranslateDialogProps, 'cv'> {
  cv: SavedCV | null;
}

const LOCALE_KEY: Record<ResumeLocale, 'pt' | 'en'> = { 'pt-BR': 'pt', en: 'en' };

const lines = (...parts: (string | undefined)[]) => parts.filter((part) => part?.trim()).join('\n');

const dates = (start?: string, end?: string) => [start, end].filter((part) => part?.trim()).join(' – ');

const projectsText = (cv: CVData) =>
  (cv.projects ?? []).map((project) => `${project.name}: ${project.description}`).join('\n\n');

const useComparisons = (base: CVData, cv: CVData): Comparison[] => {
  const { t } = useTranslation();
  return [
    { key: 'headline', label: t('ai.tailor.section_headline'), before: base.jobTitle, after: cv.jobTitle },
    { key: 'summary', label: t('ai.tailor.section_summary'), before: base.objective, after: cv.objective },
    { key: 'skills', label: t('ai.tailor.section_skills'), before: base.skills, after: cv.skills },
    { key: 'softSkills', label: t('ai.tailor.softSkills'), before: base.softSkills ?? '', after: cv.softSkills ?? '' },
    {
      key: 'interpersonal',
      label: t('ai.translate.section_interpersonal'),
      before: base.interpersonalSkills ?? '',
      after: cv.interpersonalSkills ?? '',
    },
    ...base.experience.map((original, index) => ({
      key: `experience-${original.id}`,
      label: `${t('ai.tailor.section_experience')}: ${original.company}`,
      before: lines(original.role, dates(original.startDate, original.endDate), original.description),
      after: lines(cv.experience[index].role, dates(cv.experience[index].startDate, cv.experience[index].endDate), cv.experience[index].description),
    })),
    ...base.education.map((original, index) => ({
      key: `education-${original.id}`,
      label: `${t('ai.tailor.section_education')}: ${original.institution}`,
      before: lines(original.course, dates(original.startDate, original.endDate), original.topics),
      after: lines(cv.education[index].course, dates(cv.education[index].startDate, cv.education[index].endDate), cv.education[index].topics),
    })),
    { key: 'projects', label: t('ai.tailor.section_projects'), before: projectsText(base), after: projectsText(cv) },
    { key: 'languages', label: t('ai.translate.section_languages'), before: base.languages ?? '', after: cv.languages ?? '' },
  ];
};

const TranslateResultView = ({
  base,
  result,
  title,
  onTitleChange,
}: {
  base: CVData;
  result: TranslateResult;
  title: string;
  onTitleChange: (title: string) => void;
}) => {
  const { t } = useTranslation();
  const titleId = useId();
  const comparisons = useComparisons(base, result.cv);

  return (
    <div className="space-y-4">
      <Form layout="vertical" component={false}>
        <Form.Item label={t('ai.tailor.newTitle')} htmlFor={titleId}>
          <Input id={titleId} value={title} onChange={(event) => onTitleChange(event.target.value)} />
        </Form.Item>
      </Form>
      {result.untranslatedItems > 0 && (
        <Alert type="warning" showIcon role="note" title={t('ai.translate.untranslated', { count: result.untranslatedItems })} />
      )}
      {result.discardedItems > 0 && (
        <Alert type="info" role="note" title={t('ai.translate.discarded', { count: result.discardedItems })} />
      )}
      <ResumeComparison items={comparisons} />
    </div>
  );
};

export const TranslateModal = ({ cv, ...props }: TranslateModalProps) =>
  cv ? <TranslateDialog cv={cv} {...props} /> : null;

const TranslateDialog = ({ cv, settings, isConfigured, onOpenSettings, onClose, onSave }: TranslateDialogProps) => {
  const { t, i18n } = useTranslation();
  const from = detectResumeLocale(cv, i18n.language);
  const to = otherLocale(from);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AIErrorDescription | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (result) headingRef.current?.focus();
  }, [result]);

  const handleTranslate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    try {
      const next = await translateResume(settings, cv, from, to, { signal: controller.signal });
      setResult(next);
      setTitle(t('ai.translate.copyTitle', { title: cv.title, language: t(`language.${LOCALE_KEY[to]}`) }));
    } catch (err) {
      if (!controller.signal.aborted) setError(describeAIError(err, t, settings.provider));
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  };

  const handleCancelRequest = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  const handleSave = () => {
    if (!result) return;
    onSave({
      ...result.cv,
      title: title.trim() || cv.title,
      meta: { ...cv.meta, sourceCvId: cv.id, createdByAI: true },
    });
    onClose();
  };

  const renderFooter = () => {
    if (busy) return <Button onClick={handleCancelRequest}>{t('ai.tailor.cancel')}</Button>;
    if (result) {
      return (
        <>
          <Button onClick={onClose}>{t('ai.tailor.discard')}</Button>
          <Button type="primary" onClick={handleSave}>
            {t('ai.tailor.save')}
          </Button>
        </>
      );
    }
    return (
      <>
        <Button onClick={onClose}>{t('modal.cancel')}</Button>
        <Button type="primary" icon={<Languages size={16} aria-hidden />} onClick={handleTranslate} disabled={!isConfigured}>
          {t('ai.translate.start')}
        </Button>
      </>
    );
  };

  return (
    <Modal
      open
      title={t('ai.translate.title')}
      onCancel={busy ? handleCancelRequest : onClose}
      footer={renderFooter()}
      width={result ? 900 : 560}
      destroyOnHidden
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          {t('ai.translate.intro', { title: cv.title, language: t(`ai.translate.language_${LOCALE_KEY[to]}`) })}
        </p>
        {!result && <p className="text-sm text-gray-500">{t('ai.translate.scope')}</p>}

        {!isConfigured && (
          <Alert
            type="warning"
            showIcon
            title={t('ai.tailor.notConfigured')}
            action={
              <Button type="primary" onClick={onOpenSettings}>
                {t('ai.tailor.openSettings')}
              </Button>
            }
          />
        )}

        <div role="alert">
          {error && (
            <StatusAlert tone="error" detail={error.detail}>
              {error.message}
            </StatusAlert>
          )}
        </div>

        <output className="block" aria-live="polite">
          {busy && <StatusAlert tone="busy">{t('ai.translate.translating')}</StatusAlert>}
        </output>

        {result && (
          <>
            <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-gray-800 outline-none">
              {t('ai.translate.result')}
            </h3>
            <TranslateResultView base={cv} result={result} title={title} onTitleChange={setTitle} />
          </>
        )}
      </div>
    </Modal>
  );
};
