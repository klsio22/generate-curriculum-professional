import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp, Alert, Button, Drawer, Input } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { Check, MessageSquare, Send } from 'lucide-react';
import type { CVData, SavedCV } from '@/types/cv';
import { StatusAlert } from '@/shared/components/StatusAlert';
import { contentOf } from '@/features/history/history';
import { contentLocaleOf } from '@/shared/locale';
import { describeAIError, type AIErrorDescription } from './errorMessage';
import { compareResumes } from './compareResumes';
import { refineResume } from './refine';
import { ResumeComparison } from './ResumeComparison';
import type { RefineTurn } from './prompts';
import type { AISettings } from './types';

export interface ChatJob {
  title: string;
  text: string;
}

interface ChatBodyProps {
  cv: SavedCV;
  baseCV: SavedCV | null;
  job: ChatJob | null;
  missingKeywords: string[];
  initialMessage: string;
  settings: AISettings;
  isConfigured: boolean;
  onOpenSettings: () => void;
  onApply: (next: CVData, request: string, reply: string) => void;
  onFacts: (facts: string[]) => void;
  onAddFactsToBase: (facts: string[]) => void;
}

interface RefineChatDrawerProps extends Omit<ChatBodyProps, 'cv'> {
  cv: SavedCV | null;
  onClose: () => void;
}

type ProposalStatus = 'pending' | 'applied' | 'discarded';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  request?: string;
  proposal?: { cv: CVData; base: CVData; status: ProposalStatus };
  facts?: string[];
  discardedItems?: number;
}

const SUGGESTIONS = ['suggestion_shorter', 'suggestion_results', 'suggestion_review'] as const;

const sameContent = (a: CVData, b: CVData) => JSON.stringify(contentOf(a)) === JSON.stringify(contentOf(b));

const toTurns = (items: ChatItem[]): RefineTurn[] =>
  items.map((item) =>
    item.role === 'user'
      ? { role: 'user', content: item.text }
      : { role: 'assistant', content: JSON.stringify({ reply: item.text, patch: null, declaredFacts: [] }) },
  );

const ProposalCard = ({
  item,
  current,
  onApply,
  onDiscard,
}: {
  item: ChatItem;
  current: CVData;
  onApply: () => void;
  onDiscard: () => void;
}) => {
  const { t } = useTranslation();
  if (!item.proposal) return null;
  const { cv, base, status } = item.proposal;
  const changes = compareResumes(t, base, cv).filter((comparison) => comparison.before.trim() !== comparison.after.trim());
  const outdated = status === 'pending' && !sameContent(base, current);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-purple-200 bg-white p-3">
      <h4 className="font-semibold text-gray-800">{t('chat.proposal')}</h4>
      <ResumeComparison items={changes} />
      {status === 'applied' && (
        <p className="flex items-center gap-1 text-sm text-emerald-700">
          <Check size={14} aria-hidden />
          {t('chat.applied')}
        </p>
      )}
      {status === 'discarded' && <p className="text-sm text-gray-500">{t('chat.discarded')}</p>}
      {outdated && <p className="text-sm text-gray-500">{t('chat.outdated')}</p>}
      {status === 'pending' && !outdated && (
        <div className="flex gap-2">
          <Button type="primary" size="small" onClick={onApply}>
            {t('chat.apply')}
          </Button>
          <Button size="small" onClick={onDiscard}>
            {t('chat.discard')}
          </Button>
        </div>
      )}
    </div>
  );
};

const FactsNote = ({ facts, canAddToBase, onAddToBase }: { facts: string[]; canAddToBase: boolean; onAddToBase: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">
      <h4 className="font-semibold text-gray-800">{t('chat.factsTitle')}</h4>
      <ul className="my-1 list-disc pl-5 text-gray-700">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <p className="text-gray-600">{t('chat.factsHelp')}</p>
      {canAddToBase && (
        <Button size="small" className="mt-2" onClick={onAddToBase}>
          {t('chat.addFactsToBase')}
        </Button>
      )}
    </div>
  );
};

const ChatBody = ({
  cv,
  baseCV,
  job,
  missingKeywords,
  initialMessage,
  settings,
  isConfigured,
  onOpenSettings,
  onApply,
  onFacts,
  onAddFactsToBase,
}: ChatBodyProps) => {
  const { t, i18n } = useTranslation();
  const { modal } = AntdApp.useApp();
  const hintId = useId();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState(initialMessage);
  const [seenInitial, setSeenInitial] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AIErrorDescription | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<TextAreaRef>(null);
  const endRef = useRef<HTMLDivElement>(null);

  if (initialMessage !== seenInitial) {
    setSeenInitial(initialMessage);
    setDraft(initialMessage);
  }

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [items, busy]);

  const fillDraft = (text: string) => {
    setDraft(text);
    inputRef.current?.focus();
  };

  const send = async () => {
    const request = draft.trim();
    if (!request || busy || !isConfigured) return;
    const withRequest: ChatItem[] = [...items, { id: crypto.randomUUID(), role: 'user', text: request }];
    setItems(withRequest);
    setDraft('');
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    try {
      const result = await refineResume(
        settings,
        cv,
        toTurns(withRequest),
        {
          uiLanguage: i18n.language,
          resumeLanguage: contentLocaleOf(cv, i18n.language),
          declaredFacts: cv.meta?.declaredFacts ?? [],
          jobText: job?.text,
        },
        { signal: controller.signal },
      );
      if (result.declaredFacts.length > 0) onFacts(result.declaredFacts);
      setItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: result.reply,
          request,
          proposal: result.cv ? { cv: result.cv, base: cv, status: 'pending' } : undefined,
          facts: result.declaredFacts,
          discardedItems: result.discardedItems,
        },
      ]);
    } catch (err) {
      if (!controller.signal.aborted) setError(describeAIError(err, t, settings.provider));
    } finally {
      if (abortRef.current === controller) setBusy(false);
    }
  };

  const setStatus = (id: string, status: ProposalStatus) =>
    setItems((current) =>
      current.map((item) => (item.id === id && item.proposal ? { ...item, proposal: { ...item.proposal, status } } : item)),
    );

  const apply = (item: ChatItem) => {
    if (!item.proposal) return;
    onApply(item.proposal.cv, item.request ?? '', item.text);
    setStatus(item.id, 'applied');
  };

  const confirmAddToBase = (facts: string[]) => {
    if (!baseCV) return;
    modal.confirm({
      title: t('chat.addFactsTitle'),
      content: t('chat.addFactsMessage', { title: baseCV.title }),
      okText: t('chat.addFactsOk'),
      cancelText: t('modal.cancel'),
      onOk: () => onAddFactsToBase(facts),
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setBusy(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-gray-600">{t('chat.intro')}</p>
        {job && <Alert type="info" showIcon title={t('chat.jobContext', { job: job.title })} />}
        {!isConfigured && (
          <Alert
            type="warning"
            showIcon
            title={t('ai.tailor.notConfigured')}
            action={
              <Button type="primary" size="small" onClick={onOpenSettings}>
                {t('ai.tailor.openSettings')}
              </Button>
            }
          />
        )}

        {items.length === 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('chat.suggestionsTitle')}</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((key) => (
                <Button key={key} size="small" onClick={() => fillDraft(t(`chat.${key}`))}>
                  {t(`chat.${key}`)}
                </Button>
              ))}
            </div>
          </section>
        )}

        {missingKeywords.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('chat.missingTitle')}</h3>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.map((skill) => (
                <Button key={skill} size="small" type="dashed" onClick={() => fillDraft(t('chat.haveSkillMessage', { skill }))}>
                  {t('chat.haveSkill', { skill })}
                </Button>
              ))}
            </div>
          </section>
        )}

        <div role="log" aria-live="polite" aria-label={t('chat.title', { title: cv.title })} className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className={item.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[90%] rounded-lg p-3 ${item.role === 'user' ? 'bg-indigo-50 text-gray-800' : 'w-full bg-gray-50 text-gray-800'}`}
              >
                <p className="mb-1 text-xs font-semibold text-gray-500">{item.role === 'user' ? t('chat.you') : t('chat.ai')}</p>
                <p className="whitespace-pre-line">{item.text}</p>
                {item.discardedItems ? (
                  <p className="mt-2 text-sm text-gray-500">{t('chat.discardedItems', { count: item.discardedItems })}</p>
                ) : null}
                <ProposalCard item={item} current={cv} onApply={() => apply(item)} onDiscard={() => setStatus(item.id, 'discarded')} />
                {item.facts && item.facts.length > 0 && (
                  <FactsNote
                    facts={item.facts}
                    canAddToBase={baseCV !== null && baseCV.id !== cv.id}
                    onAddToBase={() => confirmAddToBase(item.facts ?? [])}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div role="alert">
          {error && (
            <StatusAlert tone="error" detail={error.detail}>
              {error.message}
            </StatusAlert>
          )}
        </div>
        <output className="block">{busy && <StatusAlert tone="busy">{t('chat.thinking')}</StatusAlert>}</output>
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-gray-200 p-4">
        <Input.TextArea
          ref={inputRef}
          aria-label={t('chat.inputLabel')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder={t('chat.placeholder')}
          aria-describedby={hintId}
          disabled={!isConfigured}
        />
        <div className="flex items-center justify-between gap-2">
          <p id={hintId} className="text-xs text-gray-500">
            {t('chat.sendHint')}
          </p>
          {busy ? (
            <Button onClick={cancel}>{t('chat.cancel')}</Button>
          ) : (
            <Button type="primary" icon={<Send size={16} aria-hidden />} onClick={send} disabled={!draft.trim() || !isConfigured}>
              {t('chat.send')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const RefineChatDrawer = ({ cv, onClose, ...props }: RefineChatDrawerProps) => {
  const { t } = useTranslation();
  return (
    <Drawer
      open={cv !== null}
      onClose={onClose}
      placement="right"
      size={560}
      title={
        <span className="flex items-center gap-2">
          <MessageSquare size={18} aria-hidden />
          {t('chat.title', { title: cv?.title ?? '' })}
        </span>
      }
      closable={{ 'aria-label': t('chat.close') }}
      styles={{ body: { padding: 0 } }}
    >
      {cv && <ChatBody key={cv.id} cv={cv} {...props} />}
    </Drawer>
  );
};
