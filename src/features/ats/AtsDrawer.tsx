import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp, Button, Drawer, Progress } from 'antd';
import { CircleAlert, CircleCheck, MessageSquare, RotateCcw, ScanSearch, Wand2 } from 'lucide-react';
import type { CVData, SavedCV } from '@/types/cv';
import { StatusAlert } from '@/shared/components/StatusAlert';
import { contentLocaleOf } from '@/shared/locale';
import { aiFixIssues, autoFix, userOnlyIssues } from './atsFixes';
import { analyzeResume, MAX_HEADLINE_LENGTH, MAX_PAGES, MIN_SKILLS, type AtsRuleResult } from './atsRules';

interface FixActions {
  onAutoFix: (next: CVData, changes: string[]) => void;
  onFixWithAI: (message: string) => void;
}

type AnalysisState = { status: 'running' } | { status: 'done'; results: AtsRuleResult[] } | { status: 'error' };

const byAttentionFirst = (a: AtsRuleResult, b: AtsRuleResult) => Number(a.ok) - Number(b.ok);

const RuleItem = ({ rule }: { rule: AtsRuleResult }) => {
  const { t } = useTranslation();
  const Icon = rule.ok ? CircleCheck : CircleAlert;
  return (
    <li className={`rounded-lg border p-3 ${rule.ok ? 'border-gray-200' : 'border-amber-300 bg-amber-50'}`}>
      <p className="flex items-start gap-2 font-medium text-gray-800">
        <Icon size={18} aria-hidden className={`mt-0.5 shrink-0 ${rule.ok ? 'text-emerald-600' : 'text-amber-600'}`} />
        <span>
          <span className="sr-only">{rule.ok ? t('ats.ok') : t('ats.attention')}: </span>
          {t(`ats.rule_${rule.id}`, { max: MAX_PAGES })}
        </span>
      </p>
      {rule.issues.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-11 text-sm text-gray-700">
          {rule.issues.map((issue) => (
            <li key={`${issue.key}-${JSON.stringify(issue.params ?? {})}`}>{t(`ats.issue_${issue.key}`, issue.params)}</li>
          ))}
        </ul>
      )}
    </li>
  );
};

const LANGUAGE_NAME_KEY = { 'pt-BR': 'ai.translate.language_pt', en: 'ai.translate.language_en' } as const;

const FixPanel = ({ cv, results, onAutoFix, onFixWithAI }: FixActions & { cv: SavedCV; results: AtsRuleResult[] }) => {
  const { t, i18n } = useTranslation();
  const { modal } = AntdApp.useApp();
  const auto = autoFix(cv);
  const aiIssues = aiFixIssues(results);
  const manual = userOnlyIssues(results);
  if (auto.changes.length === 0 && aiIssues.length === 0 && manual.length === 0) return null;

  const changeTexts = auto.changes.map((change) => {
    const params = change.key === 'list' ? { ...change.params, section: t(`ats.section_${change.params.section}`) } : change.params;
    return t(`ats.change_${change.key}`, params);
  });

  const confirmAutoFix = () =>
    modal.confirm({
      title: t('ats.autoFixTitle'),
      content: (
        <ul className="list-disc pl-5">
          {changeTexts.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      ),
      okText: t('ats.autoFixOk'),
      cancelText: t('modal.cancel'),
      onOk: () => onAutoFix(auto.cv, changeTexts),
    });

  const askAI = () => {
    const language = t(LANGUAGE_NAME_KEY[contentLocaleOf(cv, i18n.language)]);
    const lines = aiIssues.map((issue) => {
      const instruction = t(`ats.fix_${issue.key}`, { max: MAX_HEADLINE_LENGTH, min: MIN_SKILLS, language, ...issue.params });
      return `- ${instruction}`;
    });
    onFixWithAI([t('ats.aiRequest'), ...new Set(lines)].join('\n'));
  };

  return (
    <section className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/40 p-3">
      <h3 className="font-semibold text-gray-800">{t('ats.fixTitle')}</h3>
      {auto.changes.length > 0 && (
        <div className="space-y-1">
          <Button type="primary" icon={<Wand2 size={16} aria-hidden />} onClick={confirmAutoFix}>
            {t('ats.autoFix', { count: auto.changes.length })}
          </Button>
          <p className="text-sm text-gray-600">{t('ats.autoFixHelp')}</p>
        </div>
      )}
      {aiIssues.length > 0 && (
        <div className="space-y-1">
          <Button icon={<MessageSquare size={16} aria-hidden />} onClick={askAI}>
            {t('ats.aiFix', { count: aiIssues.length })}
          </Button>
          <p className="text-sm text-gray-600">{t('ats.aiFixHelp')}</p>
        </div>
      )}
      {manual.length > 0 && <p className="text-sm text-gray-700">{t('ats.manualCount', { count: manual.length })}</p>}
    </section>
  );
};

const Results = ({ results, fixPanel }: { results: AtsRuleResult[]; fixPanel: ReactNode }) => {
  const { t } = useTranslation();
  const ok = results.filter((rule) => rule.ok).length;
  const allOk = ok === results.length;
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{t('ats.summary', { ok, total: results.length })}</h3>
        <Progress
          percent={Math.round((ok / results.length) * 100)}
          showInfo={false}
          strokeColor={allOk ? '#059669' : '#d97706'}
          aria-hidden
        />
        {allOk && <p className="text-emerald-700">{t('ats.allOk')}</p>}
      </div>
      {fixPanel}
      <ul className="space-y-2">
        {[...results].sort(byAttentionFirst).map((rule) => (
          <RuleItem key={rule.id} rule={rule} />
        ))}
      </ul>
    </section>
  );
};

const AtsBody = ({ cv, onAutoFix, onFixWithAI }: FixActions & { cv: SavedCV }) => {
  const { t } = useTranslation();
  const [run, setRun] = useState(0);
  const [state, setState] = useState<AnalysisState>({ status: 'running' });

  useEffect(() => {
    let active = true;
    import('./readBackResume')
      .then(({ readBackResume }) => readBackResume(cv))
      .then((readBack) => {
        if (active) setState({ status: 'done', results: analyzeResume(cv, readBack) });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [cv, run]);

  const rerun = () => {
    setState({ status: 'running' });
    setRun((count) => count + 1);
  };

  const [applied, setApplied] = useState<string[]>([]);

  const applyAutoFix = (next: CVData, changes: string[]) => {
    setApplied(changes);
    setState({ status: 'running' });
    onAutoFix(next, changes);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">{t('ats.intro')}</p>
      <output className="block">{state.status === 'running' && <StatusAlert tone="busy">{t('ats.running')}</StatusAlert>}</output>
      <div role="alert">{state.status === 'error' && <StatusAlert tone="error">{t('ats.error')}</StatusAlert>}</div>
      {applied.length > 0 && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <h3 className="font-semibold text-gray-800">{t('ats.appliedTitle')}</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
            {applied.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <p className="mt-1 text-gray-600">{t('ats.appliedHelp')}</p>
        </section>
      )}
      {state.status === 'done' && (
        <Results
          results={state.results}
          fixPanel={<FixPanel cv={cv} results={state.results} onAutoFix={applyAutoFix} onFixWithAI={onFixWithAI} />}
        />
      )}
      {state.status !== 'running' && (
        <Button icon={<RotateCcw size={16} aria-hidden />} onClick={rerun}>
          {t('ats.rerun')}
        </Button>
      )}
    </div>
  );
};

export const AtsDrawer = ({ cv, onClose, ...actions }: FixActions & { cv: SavedCV | null; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <Drawer
      open={cv !== null}
      onClose={onClose}
      placement="right"
      size={560}
      title={
        <span className="flex items-center gap-2">
          <ScanSearch size={18} aria-hidden />
          {t('ats.title', { title: cv?.title ?? '' })}
        </span>
      }
      closable={{ 'aria-label': t('ats.close') }}
    >
      {cv && <AtsBody key={cv.id} cv={cv} {...actions} />}
    </Drawer>
  );
};
