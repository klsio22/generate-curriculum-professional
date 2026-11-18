import { useTranslation } from 'react-i18next';
import { App as AntdApp, Alert, Button, Collapse, Drawer, Empty, type CollapseProps } from 'antd';
import { History, Languages, MessageSquare, RotateCcw, Sparkles } from 'lucide-react';
import type { ResumeLocale, SavedCV } from '@/types/cv';
import { ResumeComparison } from '@/features/ai/ResumeComparison';
import { compareResumes } from '@/features/ai/compareResumes';
import { MAX_ENTRIES_PER_CV, type HistoryEntry } from './history';

interface HistoryDrawerProps {
  cv: SavedCV | null;
  entries: HistoryEntry[];
  onClose: () => void;
  onRestore: (entry: HistoryEntry) => void;
  onAskChat: (skill: string) => void;
}

const LOCALE_TEXT_KEY: Record<ResumeLocale, string> = { 'pt-BR': 'ai.translate.language_pt', en: 'ai.translate.language_en' };

const KIND_ICON = { tailor: Sparkles, translate: Languages, restore: RotateCcw, chat: MessageSquare } as const;
const MAX_REQUEST_PREVIEW = 80;

const EntryTitle = ({ entry }: { entry: HistoryEntry }) => {
  const { t } = useTranslation();
  if (entry.kind === 'tailor') {
    const job = [entry.job?.analysis.jobTitle, entry.job?.analysis.company].filter(Boolean).join(' — ');
    return <>{t('history.kind_tailor', { job: job || t('history.jobFallback') })}</>;
  }
  if (entry.kind === 'translate' && entry.from && entry.to) {
    return <>{t('history.kind_translate', { from: t(LOCALE_TEXT_KEY[entry.from]), to: t(LOCALE_TEXT_KEY[entry.to]) })}</>;
  }
  if (entry.kind === 'chat') {
    const request = entry.request ?? '';
    const preview = request.length > MAX_REQUEST_PREVIEW ? `${request.slice(0, MAX_REQUEST_PREVIEW)}…` : request;
    return <>{t('history.kind_chat', { request: preview })}</>;
  }
  return <>{t('history.kind_restore')}</>;
};

const JobDetails = ({ job, onAskChat }: { job: NonNullable<HistoryEntry['job']>; onAskChat: (skill: string) => void }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <p className="text-gray-700">
        {t('history.coverage', { before: job.coveredBefore, after: job.coveredAfter, total: job.analysis.keywords.length })}
      </p>
      {job.newTerms.length > 0 && (
        <Alert type="warning" showIcon title={<>{t('history.newTerms')}: <strong>{job.newTerms.join(', ')}</strong></>} />
      )}
      {job.missingKeywords.length > 0 && (
        <section>
          <h4 className="mb-1 font-semibold text-gray-800">{t('history.missing')}</h4>
          <div className="flex flex-wrap gap-2">
            {job.missingKeywords.map((skill) => (
              <Button key={skill} size="small" type="dashed" onClick={() => onAskChat(skill)}>
                {t('chat.haveSkill', { skill })}
              </Button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const EntryDetails = ({
  entry,
  onRestore,
  onAskChat,
}: {
  entry: HistoryEntry;
  onRestore: () => void;
  onAskChat: (skill: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {entry.job && <JobDetails job={entry.job} onAskChat={onAskChat} />}
      {entry.changes.length > 0 && (
        <section>
          <h4 className="mb-1 font-semibold text-gray-800">{t('history.changes')}</h4>
          <ul className="list-disc space-y-1 pl-5">
            {entry.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      )}
      {entry.job?.text && (
        <Collapse
          size="small"
          items={[
            {
              key: 'job',
              label: t('history.jobText'),
              children: <p className="max-h-64 overflow-y-auto whitespace-pre-line text-gray-700">{entry.job.text}</p>,
            },
          ]}
        />
      )}
      <section className="space-y-2">
        <h4 className="font-semibold text-gray-800">{t('history.compare')}</h4>
        <ResumeComparison items={compareResumes(t, entry.before, entry.after)} />
      </section>
      <Button icon={<RotateCcw size={16} aria-hidden />} onClick={onRestore}>
        {t('history.restore')}
      </Button>
    </div>
  );
};

export const HistoryDrawer = ({ cv, entries, onClose, onRestore, onAskChat }: HistoryDrawerProps) => {
  const { t, i18n } = useTranslation();
  const { modal } = AntdApp.useApp();
  const formatDate = (time: number) =>
    new Date(time).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' });

  const confirmRestore = (entry: HistoryEntry) => {
    if (!cv) return;
    modal.confirm({
      title: t('history.restoreTitle'),
      content: t('history.restoreMessage', { title: cv.title, date: formatDate(entry.createdAt) }),
      okText: t('history.restoreOk'),
      cancelText: t('modal.cancel'),
      onOk: () => onRestore(entry),
    });
  };

  const items: CollapseProps['items'] = entries.map((entry) => {
    const Icon = KIND_ICON[entry.kind];
    return {
      key: entry.id,
      label: (
        <span className="flex items-start gap-2">
          <Icon size={16} aria-hidden className="mt-0.5 shrink-0 text-purple-600" />
          <span className="flex min-w-0 flex-col">
            <span className="font-medium text-gray-800">
              <EntryTitle entry={entry} />
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(entry.createdAt)}
              {entry.model && ` · ${t('history.model', { model: entry.model })}`}
            </span>
          </span>
        </span>
      ),
      children: <EntryDetails entry={entry} onRestore={() => confirmRestore(entry)} onAskChat={onAskChat} />,
    };
  });

  return (
    <Drawer
      open={cv !== null}
      onClose={onClose}
      placement="right"
      size={720}
      title={
        <span className="flex items-center gap-2">
          <History size={18} aria-hidden />
          {t('history.title', { title: cv?.title ?? '' })}
        </span>
      }
      closable={{ 'aria-label': t('history.close') }}
    >
      {entries.length === 0 ? (
        <Empty description={t('history.empty')} />
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">{t('history.intro', { count: MAX_ENTRIES_PER_CV })}</p>
          <Collapse items={items} defaultActiveKey={entries[0] ? [entries[0].id] : []} />
        </div>
      )}
    </Drawer>
  );
};
