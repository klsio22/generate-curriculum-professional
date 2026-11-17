import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import type { SavedCV } from '@/types/cv';
import { aiErrorMessage } from './errorMessage';
import { analyzeJob, tailorResume } from './jobTailoring';
import { computeKeywordCoverage, findNewTerms } from './keywords';
import type { TailorResult } from './parse';
import { MAX_JOB_DESCRIPTION_LENGTH } from './prompts';
import { TailorResultView } from './TailorResultView';
import type { AISettings, JobAnalysis, KeywordPriority } from './types';

interface TailorJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  isConfigured: boolean;
  onOpenSettings: () => void;
  cvs: SavedCV[];
  activeId: string | null;
  /** Called with the new resume; the parent stores and selects it. */
  onSave: (cv: Omit<SavedCV, 'id' | 'updatedAt'>) => void;
}

type Step = 'input' | 'analysis' | 'result';
type OutputLanguage = 'auto' | 'pt-BR' | 'en';

const STEPS: Step[] = ['input', 'analysis', 'result'];
const PRIORITIES: KeywordPriority[] = ['high', 'medium', 'low'];

const fieldClass =
  'block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const primaryButton =
  'inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton = 'px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700';

const resolveLanguage = (choice: OutputLanguage, analysis: JobAnalysis): string => {
  if (choice !== 'auto') return choice;
  const lang = analysis.language.toLowerCase();
  if (lang.startsWith('pt')) return 'pt-BR';
  if (lang.startsWith('en')) return 'en';
  return analysis.language;
};

/** Mounted only while open, so each opening starts fresh. */
export const TailorJobModal = (props: TailorJobModalProps) =>
  props.isOpen ? <TailorJobDialog {...props} /> : null;

const TailorJobDialog = ({
  onClose,
  settings,
  isConfigured,
  onOpenSettings,
  cvs,
  activeId,
  onSave,
}: TailorJobModalProps) => {
  const { t } = useTranslation();
  const ids = { base: useId(), job: useId(), count: useId(), lang: useId() };

  const [step, setStep] = useState<Step>('input');
  const [baseId, setBaseId] = useState(activeId ?? cvs[0]?.id ?? '');
  const [jobText, setJobText] = useState('');
  const [language, setLanguage] = useState<OutputLanguage>('auto');
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState<null | 'analyzing' | 'generating'>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus to the step heading so screen readers announce the new step.
  useEffect(() => {
    if (step !== 'input') headingRef.current?.focus();
  }, [step]);

  const baseCV = cvs.find((cv) => cv.id === baseId) ?? null;

  const baseCoverage = useMemo(
    () => (baseCV && analysis ? computeKeywordCoverage(baseCV, analysis.keywords) : []),
    [baseCV, analysis],
  );
  const resultCoverage = useMemo(
    () => (result && analysis ? computeKeywordCoverage(result.cv, analysis.keywords) : []),
    [result, analysis],
  );
  const newTerms = useMemo(
    () => (baseCV && result && analysis ? findNewTerms(baseCV, result.cv, analysis.keywords) : []),
    [baseCV, result, analysis],
  );

  const run = async (kind: 'analyzing' | 'generating', action: (signal: AbortSignal) => Promise<void>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(kind);
    setError(null);
    try {
      await action(controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) setError(aiErrorMessage(err, t));
    } finally {
      if (abortRef.current === controller) setBusy(null);
    }
  };

  const handleAnalyze = () =>
    run('analyzing', async (signal) => {
      const next = await analyzeJob(settings, jobText, { signal });
      setAnalysis(next);
      setResult(null);
      setStep('analysis');
    });

  const handleGenerate = () => {
    if (!baseCV || !analysis) return;
    return run('generating', async (signal) => {
      const next = await tailorResume(settings, baseCV, analysis, resolveLanguage(language, analysis), { signal });
      setResult(next);
      const target = [analysis.jobTitle, analysis.company].filter(Boolean).join(' @ ');
      setNewTitle(`${baseCV.title} — ${target || t('ai.tailor.aiSuffix')}`);
      setStep('result');
    });
  };

  const handleCancelRequest = () => {
    abortRef.current?.abort();
    setBusy(null);
  };

  const handleSave = () => {
    if (!baseCV || !analysis || !result) return;
    // addCV gives the copy a new id, so the base resume is never overwritten.
    onSave({
      ...result.cv,
      title: newTitle.trim() || baseCV.title,
      meta: {
        targetJob: analysis.jobTitle,
        company: analysis.company,
        keywords: analysis.keywords.map((k) => k.term),
        sourceCvId: baseCV.id,
        createdByAI: true,
      },
    });
    onClose();
  };

  const stepIndex = STEPS.indexOf(step) + 1;
  const stepLabel = { input: t('ai.tailor.stepInput'), analysis: t('ai.tailor.stepAnalysis'), result: t('ai.tailor.stepResult') }[step];

  const busyFooter = (
    <button type="button" onClick={handleCancelRequest} className={secondaryButton}>
      {t('ai.tailor.cancel')}
    </button>
  );

  const footers: Record<Step, ReactNode> = {
    input: (
      <>
        <button type="button" onClick={onClose} className={secondaryButton}>
          {t('modal.cancel')}
        </button>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!isConfigured || !baseCV || jobText.trim().length < 50}
          className={primaryButton}
        >
          {t('ai.tailor.analyze')}
        </button>
      </>
    ),
    analysis: (
      <>
        <button type="button" onClick={() => setStep('input')} className={secondaryButton}>
          {t('ai.tailor.back')}
        </button>
        <button type="button" onClick={handleGenerate} disabled={!baseCV} className={primaryButton}>
          <Sparkles size={16} aria-hidden />
          {t('ai.tailor.generate')}
        </button>
      </>
    ),
    result: (
      <>
        <button type="button" onClick={onClose} className={secondaryButton}>
          {t('ai.tailor.discard')}
        </button>
        <button type="button" onClick={() => setStep('analysis')} className={secondaryButton}>
          {t('ai.tailor.back')}
        </button>
        <button type="button" onClick={handleSave} className={primaryButton}>
          {t('ai.tailor.save')}
        </button>
      </>
    ),
  };

  return (
    <Modal
      isOpen
      title={t('ai.tailor.title')}
      onCancel={busy ? handleCancelRequest : onClose}
      footer={busy ? busyFooter : footers[step]}
      size="xl"
    >
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('ai.tailor.stepOf', { current: stepIndex, total: STEPS.length })}: {stepLabel}
        </p>

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}

        <div role="status" aria-live="polite">
          {busy && (
            <p className="flex items-center gap-2 rounded-md bg-indigo-50 p-3 text-indigo-900">
              <Loader2 size={18} className="animate-spin" aria-hidden />
              {busy === 'analyzing' ? t('ai.tailor.analyzing') : t('ai.tailor.generating')}
            </p>
          )}
        </div>

        {step === 'input' && (
          <div className="space-y-4">
            <p className="text-gray-600">{t('ai.tailor.intro')}</p>

            {!isConfigured && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <span>{t('ai.tailor.notConfigured')}</span>
                <button type="button" onClick={onOpenSettings} className={primaryButton}>
                  {t('ai.tailor.openSettings')}
                </button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor={ids.base} className="mb-1 block text-sm font-medium text-gray-700">
                  {t('ai.tailor.baseCv')}
                </label>
                <select id={ids.base} value={baseId} onChange={(e) => setBaseId(e.target.value)} className={fieldClass}>
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={ids.lang} className="mb-1 block text-sm font-medium text-gray-700">
                  {t('ai.tailor.outputLanguage')}
                </label>
                <select
                  id={ids.lang}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as OutputLanguage)}
                  className={fieldClass}
                >
                  <option value="auto">{t('ai.tailor.languageAuto')}</option>
                  <option value="pt-BR">{t('ai.tailor.languagePt')}</option>
                  <option value="en">{t('ai.tailor.languageEn')}</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor={ids.job} className="mb-1 block text-sm font-medium text-gray-700">
                {t('ai.tailor.jobDescription')}
              </label>
              <textarea
                id={ids.job}
                data-autofocus
                rows={12}
                value={jobText}
                maxLength={MAX_JOB_DESCRIPTION_LENGTH}
                onChange={(e) => setJobText(e.target.value)}
                placeholder={t('ai.tailor.jobPlaceholder')}
                aria-describedby={ids.count}
                disabled={busy !== null}
                className={fieldClass}
              />
              <p id={ids.count} className="mt-1 text-right text-xs text-gray-500">
                {t('ai.tailor.charCount', {
                  count: jobText.length.toLocaleString(),
                  max: MAX_JOB_DESCRIPTION_LENGTH.toLocaleString(),
                })}
              </p>
            </div>
          </div>
        )}

        {step === 'analysis' && analysis && (
          <div className="space-y-4">
            <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-gray-800 outline-none">
              {t('ai.tailor.stepAnalysis')}
            </h3>
            <dl className="grid gap-3 rounded-md bg-gray-50 p-3 sm:grid-cols-3">
              {[
                [t('ai.tailor.jobTitle'), analysis.jobTitle],
                [t('ai.tailor.company'), analysis.company],
                [t('ai.tailor.seniority'), analysis.seniority],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800">{value || t('ai.tailor.notInformed')}</dd>
                </div>
              ))}
            </dl>
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
                    <ul className="flex flex-wrap gap-2">
                      {items.map((k) => (
                        <li
                          key={k.term}
                          className={`rounded-full border px-3 py-1 text-sm ${
                            k.count > 0
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : 'border-gray-300 bg-white text-gray-700'
                          }`}
                        >
                          <span aria-hidden>{k.count > 0 ? '✓ ' : '○ '}</span>
                          {k.term}
                          <span className="sr-only">
                            {' '}
                            ({k.count > 0 ? t('ai.tailor.inResume') : t('ai.tailor.notInResume')})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            {analysis.requirements.length > 0 && (
              <details className="rounded-md border border-gray-200">
                <summary className="cursor-pointer px-3 py-2 font-medium text-gray-800">
                  {t('ai.tailor.requirements')}
                </summary>
                <ul className="list-disc space-y-1 px-3 pb-3 pl-8">
                  {analysis.requirements.map((req) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {step === 'result' && result && baseCV && (
          <div className="space-y-4">
            <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-gray-800 outline-none">
              {t('ai.tailor.stepResult')}
            </h3>
            <TailorResultView
              base={baseCV}
              result={result}
              coverageBefore={baseCoverage}
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
