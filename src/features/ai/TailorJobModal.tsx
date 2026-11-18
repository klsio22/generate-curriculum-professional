import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Collapse, Descriptions, Form, Input, Modal, Select, Steps, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles } from 'lucide-react';
import type { CVData, SavedCV } from '@/types/cv';
import { contentOf, type HistoryRecord } from '@/features/history/history';
import { describeAIError, type AIErrorDescription } from './errorMessage';
import { StatusAlert } from '@/shared/components/StatusAlert';
import { analyzeJob, tailorResume } from './jobTailoring';
import { prepareTailorBase } from './translation';
import { computeKeywordCoverage, findNewTerms } from './keywords';
import type { TailorResult } from './parse';
import { MAX_JOB_DESCRIPTION_LENGTH } from './prompts';
import { TailorResultView } from './TailorResultView';
import type { AISettings, JobAnalysis, KeywordPriority } from './types';

interface TailorJobDialogProps {
  onClose: () => void;
  settings: AISettings;
  isConfigured: boolean;
  onOpenSettings: () => void;
  cvs: SavedCV[];
  activeId: string | null;
  onSave: (cv: Omit<SavedCV, 'id' | 'updatedAt'>, record: HistoryRecord) => void;
}

interface TailorJobModalProps extends TailorJobDialogProps {
  isOpen: boolean;
}

type Step = 'input' | 'analysis' | 'result';
type OutputLanguage = 'auto' | 'pt-BR' | 'en';

const STEPS: Step[] = ['input', 'analysis', 'result'];
const BUSY_MESSAGE = {
  analyzing: 'ai.tailor.analyzing',
  translating: 'ai.tailor.translatingBase',
  generating: 'ai.tailor.generating',
} as const;
const PRIORITIES: KeywordPriority[] = ['high', 'medium', 'low'];


const resolveLanguage = (choice: OutputLanguage, analysis: JobAnalysis): string => {
  if (choice !== 'auto') return choice;
  const lang = analysis.language.toLowerCase();
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('en')) return 'en';
  return analysis.language;
};

export const TailorJobModal = ({ isOpen, ...props }: TailorJobModalProps) =>
  isOpen ? <TailorJobDialog {...props} /> : null;

const TailorJobDialog = ({
  onClose,
  settings,
  isConfigured,
  onOpenSettings,
  cvs,
  activeId,
  onSave,
}: TailorJobDialogProps) => {
  const { t, i18n } = useTranslation();
  const ids = { base: useId(), job: useId(), lang: useId() };

  const [step, setStep] = useState<Step>('input');
  const [baseId, setBaseId] = useState(activeId ?? cvs[0]?.id ?? '');
  const [jobText, setJobText] = useState('');
  const [language, setLanguage] = useState<OutputLanguage>('auto');
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState<null | 'analyzing' | 'translating' | 'generating'>(null);
  const [workingBase, setWorkingBase] = useState<CVData | null>(null);
  const [error, setError] = useState<AIErrorDescription | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (step !== 'input') headingRef.current?.focus();
  }, [step]);

  const baseCV = cvs.find((cv) => cv.id === baseId) ?? null;

  const baseCoverage = useMemo(
    () => (baseCV && analysis ? computeKeywordCoverage(baseCV, analysis.keywords) : []),
    [baseCV, analysis],
  );
  const resultBase = workingBase ?? baseCV;
  const resultBaseCoverage = useMemo(
    () => (resultBase && analysis ? computeKeywordCoverage(resultBase, analysis.keywords) : []),
    [resultBase, analysis],
  );
  const resultCoverage = useMemo(
    () => (result && analysis ? computeKeywordCoverage(result.cv, analysis.keywords) : []),
    [result, analysis],
  );
  const newTerms = useMemo(
    () => (resultBase && result && analysis ? findNewTerms(resultBase, result.cv, analysis.keywords) : []),
    [resultBase, result, analysis],
  );

  const run = async (kind: 'analyzing' | 'translating' | 'generating', action: (signal: AbortSignal) => Promise<void>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(kind);
    setError(null);
    try {
      await action(controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) setError(describeAIError(err, t, settings.provider));
    } finally {
      if (abortRef.current === controller) setBusy(null);
    }
  };

  const handleAnalyze = () =>
    run('analyzing', async (signal) => {
      const next = await analyzeJob(settings, jobText, { signal });
      setAnalysis(next);
      setResult(null);
      setWorkingBase(null);
      setStep('analysis');
    });

  const handleGenerate = () => {
    if (!baseCV || !analysis) return;
    return run('generating', async (signal) => {
      const outputLanguage = resolveLanguage(language, analysis);
      const base = await prepareTailorBase(settings, baseCV, outputLanguage, i18n.language, { signal }, () =>
        setBusy('translating'),
      );
      setBusy('generating');
      const next = await tailorResume(settings, base, analysis, outputLanguage, { signal });
      setWorkingBase(base);
      setResult(next);
      setNewTitle(analysis.jobTitle.trim() || `${baseCV.title} — ${t('ai.tailor.aiSuffix')}`);
      setStep('result');
    });
  };

  const handleCancelRequest = () => {
    abortRef.current?.abort();
    setBusy(null);
  };

  const handleSave = () => {
    if (!baseCV || !resultBase || !analysis || !result) return;
    const saved = {
      ...result.cv,
      title: newTitle.trim() || baseCV.title,
      meta: {
        targetJob: analysis.jobTitle,
        company: analysis.company,
        keywords: analysis.keywords.map((k) => k.term),
        sourceCvId: baseCV.id,
        createdByAI: true,
      },
    };
    onSave(saved, {
      kind: 'tailor',
      before: contentOf(resultBase),
      after: contentOf(saved),
      changes: result.changes,
      job: {
        text: jobText,
        analysis,
        coveredBefore: resultBaseCoverage.filter((k) => k.count > 0).length,
        coveredAfter: resultCoverage.filter((k) => k.count > 0).length,
        missingKeywords: result.missingKeywords,
        newTerms,
      },
    });
    onClose();
  };

  const stepIndex = STEPS.indexOf(step) + 1;
  const stepLabels: Record<Step, string> = {
    input: t('ai.tailor.stepInput'),
    analysis: t('ai.tailor.stepAnalysis'),
    result: t('ai.tailor.stepResult'),
  };

  const busyFooter = <Button onClick={handleCancelRequest}>{t('ai.tailor.cancel')}</Button>;

  const footers: Record<Step, ReactNode> = {
    input: (
      <>
        <Button onClick={onClose}>{t('modal.cancel')}</Button>
        <Button type="primary" onClick={handleAnalyze} disabled={!isConfigured || !baseCV || jobText.trim().length < 50}>
          {t('ai.tailor.analyze')}
        </Button>
      </>
    ),
    analysis: (
      <>
        <Button onClick={() => setStep('input')}>{t('ai.tailor.back')}</Button>
        <Button type="primary" icon={<Sparkles size={16} aria-hidden />} onClick={handleGenerate} disabled={!baseCV}>
          {t('ai.tailor.generate')}
        </Button>
      </>
    ),
    result: (
      <>
        <Button onClick={onClose}>{t('ai.tailor.discard')}</Button>
        <Button onClick={() => setStep('analysis')}>{t('ai.tailor.back')}</Button>
        <Button type="primary" onClick={handleSave}>
          {t('ai.tailor.save')}
        </Button>
      </>
    ),
  };

  return (
    <Modal
      open
      title={t('ai.tailor.title')}
      onCancel={busy ? handleCancelRequest : onClose}
      footer={busy ? busyFooter : footers[step]}
      width={900}
      destroyOnHidden
    >
      <div className="space-y-4">
        <Steps
          size="small"
          current={stepIndex - 1}
          items={STEPS.map((item) => ({ title: stepLabels[item] }))}
          aria-hidden
        />
        <p className="sr-only">
          {t('ai.tailor.stepOf', { current: stepIndex, total: STEPS.length })}: {stepLabels[step]}
        </p>

        <div role="alert">
          {error && (
            <StatusAlert tone="error" detail={error.detail}>
              {error.message}
            </StatusAlert>
          )}
        </div>

        <output className="block" aria-live="polite">
          {busy && (
            <StatusAlert tone="busy">{t(BUSY_MESSAGE[busy])}</StatusAlert>
          )}
        </output>

        {step === 'input' && (
          <Form layout="vertical" component={false}>
            <div className="space-y-4">
              <p className="text-gray-600">{t('ai.tailor.intro')}</p>

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

              <div className="grid gap-x-4 md:grid-cols-2">
                <Form.Item label={t('ai.tailor.baseCv')} htmlFor={ids.base}>
                  <Select
                    id={ids.base}
                    value={baseId || undefined}
                    onChange={setBaseId}
                    options={cvs.map((cv) => ({ value: cv.id, label: cv.title }))}
                  />
                </Form.Item>
                <Form.Item label={t('ai.tailor.outputLanguage')} htmlFor={ids.lang}>
                  <Select
                    id={ids.lang}
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: 'auto', label: t('ai.tailor.languageAuto') },
                      { value: 'pt-BR', label: t('ai.tailor.languagePt') },
                      { value: 'en', label: t('ai.tailor.languageEn') },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item
                label={t('ai.tailor.jobDescription')}
                htmlFor={ids.job}
                className="mb-0"
                extra={
                  <span className="block text-right">
                    {t('ai.tailor.charCount', {
                      count: jobText.length.toLocaleString(i18n.language),
                      max: MAX_JOB_DESCRIPTION_LENGTH.toLocaleString(i18n.language),
                    })}
                  </span>
                }
              >
                <Input.TextArea
                  id={ids.job}
                  autoFocus
                  rows={12}
                  value={jobText}
                  maxLength={MAX_JOB_DESCRIPTION_LENGTH}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder={t('ai.tailor.jobPlaceholder')}
                  disabled={busy !== null}
                />
              </Form.Item>
            </div>
          </Form>
        )}

        {step === 'analysis' && analysis && (
          <div className="space-y-4">
            <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-gray-800 outline-none">
              {t('ai.tailor.stepAnalysis')}
            </h3>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 3 }}
              layout="vertical"
              items={[
                { key: 'job', label: t('ai.tailor.jobTitle'), children: analysis.jobTitle || t('ai.tailor.notInformed') },
                { key: 'company', label: t('ai.tailor.company'), children: analysis.company || t('ai.tailor.notInformed') },
                { key: 'seniority', label: t('ai.tailor.seniority'), children: analysis.seniority || t('ai.tailor.notInformed') },
              ]}
            />
            {analysis.summary && <p className="text-gray-700">{analysis.summary}</p>}

            <section>
              <h4 className="mb-1 font-semibold text-gray-800">{t('ai.tailor.keywordsTitle')}</h4>
              <p className="mb-3 text-gray-600">
                {t('ai.tailor.baseCoverage', {
                  covered: baseCoverage.filter((k) => k.count > 0).length,
                  total: baseCoverage.length,
                })}
              </p>
              {PRIORITIES.map((priority) => {
                const items = baseCoverage.filter((k) => k.priority === priority);
                if (items.length === 0) return null;
                return (
                  <div key={priority} className="mb-3">
                    <h5 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {t(`ai.tailor.priority_${priority}`)}
                    </h5>
                    <ul className="flex flex-wrap gap-y-2">
                      {items.map((k) => (
                        <li key={k.term}>
                          <Tag
                            color={k.count > 0 ? 'success' : undefined}
                            icon={k.count > 0 ? <Check size={12} className="mr-1 inline" aria-hidden /> : undefined}
                            className="text-sm"
                          >
                            {k.term}
                            <span className="sr-only">
                              {' '}
                              ({k.count > 0 ? t('ai.tailor.inResume') : t('ai.tailor.notInResume')})
                            </span>
                          </Tag>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            {analysis.requirements.length > 0 && (
              <Collapse
                items={[
                  {
                    key: 'requirements',
                    label: <span className="font-medium">{t('ai.tailor.requirements')}</span>,
                    children: (
                      <ul className="list-disc space-y-1 pl-5">
                        {analysis.requirements.map((req) => (
                          <li key={req}>{req}</li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
              />
            )}
          </div>
        )}

        {step === 'result' && result && resultBase && (
          <div className="space-y-4">
            <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-gray-800 outline-none">
              {t('ai.tailor.stepResult')}
            </h3>
            <TailorResultView
              base={resultBase}
              result={result}
              coverageBefore={resultBaseCoverage}
              coverageAfter={resultCoverage}
              newTerms={newTerms}
              title={newTitle}
              onTitleChange={setNewTitle}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
