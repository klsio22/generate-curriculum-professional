import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { listModels, testConnection } from './client';
import { aiErrorMessage } from './errorMessage';
import { AI_PROVIDERS } from './providers';
import type { AIProviderId, AISettings } from './types';

interface AISettingsModalProps {
  isOpen: boolean;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  onForgetKey: () => void;
  onClose: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

const inputClass =
  'block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';

/** Mounted only while open, so every opening starts from the saved settings. */
export const AISettingsModal = (props: AISettingsModalProps) =>
  props.isOpen ? <AISettingsDialog {...props} /> : null;

const AISettingsDialog = ({
  settings,
  onSave,
  onForgetKey,
  onClose,
}: AISettingsModalProps) => {
  const { t } = useTranslation();
  const ids = {
    provider: useId(),
    baseUrl: useId(),
    apiKey: useId(),
    apiKeyHelp: useId(),
    model: useId(),
    modelHelp: useId(),
    modelList: useId(),
    modelSearch: useId(),
    modelCount: useId(),
    privacy: useId(),
  };

  const [draft, setDraft] = useState<AISettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any request still running when the dialog closes.
  useEffect(() => () => abortRef.current?.abort(), []);

  const preset = AI_PROVIDERS[draft.provider];
  const busy = status.kind === 'busy';

  const update = (patch: Partial<AISettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus({ kind: 'idle' });
  };

  const changeProvider = (provider: AIProviderId) => {
    setModels([]);
    update({
      provider,
      baseUrl: AI_PROVIDERS[provider].baseUrl || (provider === draft.provider ? draft.baseUrl : ''),
      model: provider === draft.provider ? draft.model : '',
    });
  };

  const run = async (message: string, action: (signal: AbortSignal) => Promise<string>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: 'busy', message });
    try {
      setStatus({ kind: 'success', message: await action(controller.signal) });
    } catch (error) {
      if (!controller.signal.aborted) setStatus({ kind: 'error', message: aiErrorMessage(error, t) });
    }
  };

  const handleLoadModels = () =>
    run(t('ai.settings.loadingModels'), async (signal) => {
      const list = await listModels(draft, { signal });
      setModels(list);
      return t('ai.settings.modelsLoaded', { count: list.length });
    });

  const handleTest = () =>
    run(t('ai.settings.testing'), async (signal) => {
      await testConnection(draft, { signal });
      return t('ai.settings.testSuccess');
    });

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const handleForgetKey = () => {
    onForgetKey();
    update({ apiKey: '' });
    setStatus({ kind: 'success', message: t('ai.settings.keyForgotten') });
  };

  const canTest = draft.baseUrl.trim() !== '' && draft.model.trim() !== '' && !busy;

  const footer = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm text-gray-700"
      >
        {t('modal.cancel')}
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
      >
        {t('ai.settings.save')}
      </button>
    </>
  );

  return (
    <Modal isOpen title={t('ai.settings.title')} onCancel={onClose} footer={footer} size="lg">
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <p className="text-gray-600">{t('ai.settings.intro')}</p>

        <div>
          <label htmlFor={ids.provider} className="block text-sm font-medium text-gray-700 mb-1">
            {t('ai.settings.provider')}
          </label>
          <select
            id={ids.provider}
            data-autofocus
            value={draft.provider}
            onChange={(e) => changeProvider(e.target.value as AIProviderId)}
            className={inputClass}
          >
            {Object.values(AI_PROVIDERS).map((option) => (
              <option key={option.id} value={option.id}>
                {option.id === 'custom' ? t('ai.settings.customProvider') : option.label}
              </option>
            ))}
          </select>
        </div>

        {draft.provider === 'custom' && (
          <div>
            <label htmlFor={ids.baseUrl} className="block text-sm font-medium text-gray-700 mb-1">
              {t('ai.settings.baseUrl')}
            </label>
            <input
              id={ids.baseUrl}
              type="url"
              value={draft.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder="http://localhost:11434/v1"
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor={ids.apiKey} className="block text-sm font-medium text-gray-700 mb-1">
            {t('ai.settings.apiKey')}
          </label>
          <div className="flex gap-2">
            <input
              id={ids.apiKey}
              type={showKey ? 'text' : 'password'}
              value={draft.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${ids.apiKeyHelp} ${ids.privacy}`}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-pressed={showKey}
              aria-label={showKey ? t('ai.settings.hideKey') : t('ai.settings.showKey')}
              className="px-3 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              {showKey ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </button>
          </div>
          <p id={ids.apiKeyHelp} className="mt-1 text-xs text-gray-500">
            {preset.keyUrl ? (
              <a
                href={preset.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-700 underline"
              >
                {t('ai.settings.getKey', { provider: preset.label })}
                <ExternalLink size={12} aria-hidden />
                <span className="sr-only">{t('ai.settings.opensInNewTab')}</span>
              </a>
            ) : (
              t('ai.settings.customKeyHelp')
            )}
          </p>
        </div>

        <div>
          <label htmlFor={ids.model} className="block text-sm font-medium text-gray-700 mb-1">
            {t('ai.settings.model')}
          </label>
          <div className="flex gap-2">
            <input
              id={ids.model}
              type="text"
              value={draft.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder={t('ai.settings.modelExample', { example: preset.modelExample })}
              aria-describedby={ids.modelHelp}
              spellCheck={false}
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleLoadModels}
              disabled={busy || !draft.baseUrl.trim()}
              className="px-3 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap disabled:opacity-50"
            >
              {t('ai.settings.loadModels')}
            </button>
          </div>
          <p id={ids.modelHelp} className="mt-1 text-xs text-gray-500">
            {t('ai.settings.modelHelp')}
          </p>

          {models.length > 0 && (
            <ModelPicker
              models={models}
              value={draft.model}
              onPick={(model) => update({ model })}
              ids={{ search: ids.modelSearch, list: ids.modelList, count: ids.modelCount }}
            />
          )}
        </div>

        <p id={ids.privacy} className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          {t('ai.settings.privacy')}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={!canTest}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
          >
            {t('ai.settings.test')}
          </button>
          {settings.apiKey && (
            <button
              type="button"
              onClick={handleForgetKey}
              className="px-4 py-2 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-sm"
            >
              {t('ai.settings.forgetKey')}
            </button>
          )}
        </div>

        <div aria-live="polite" role="status" className="min-h-5 text-sm">
          {status.kind === 'busy' && (
            <span className="inline-flex items-center gap-2 text-gray-600">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              {status.message}
            </span>
          )}
          {status.kind === 'success' && <span className="text-emerald-700">✓ {status.message}</span>}
          {status.kind === 'error' && <span className="text-red-700">✗ {status.message}</span>}
        </div>
      </form>
    </Modal>
  );
};

interface ModelPickerProps {
  models: string[];
  value: string;
  onPick: (model: string) => void;
  ids: { search: string; list: string; count: string };
}

/** OpenRouter marks free models with the ":free" suffix. */
const isFreeModel = (model: string) => model.endsWith(':free');

/**
 * Visible, searchable list of the provider's models. A native <select size>
 * is used as the listbox, so keyboard and screen reader support come for free.
 */
const ModelPicker = ({ models, value, onPick, ids }: ModelPickerProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const hasFreeModels = useMemo(() => models.some(isFreeModel), [models]);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return models.filter(
      (model) =>
        (!freeOnly || isFreeModel(model)) && terms.every((term) => model.toLowerCase().includes(term)),
    );
  }, [models, query, freeOnly]);

  return (
    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor={ids.search} className="block text-xs font-medium text-gray-700 mb-1">
            {t('ai.settings.modelSearch')}
          </label>
          <input
            id={ids.search}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('ai.settings.modelSearchPlaceholder')}
            aria-controls={ids.list}
            spellCheck={false}
            className={inputClass}
          />
        </div>
        {hasFreeModels && (
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            {t('ai.settings.freeOnly')}
          </label>
        )}
      </div>

      <label htmlFor={ids.list} className="sr-only">
        {t('ai.settings.modelList')}
      </label>
      {filtered.length > 0 ? (
        <select
          id={ids.list}
          size={8}
          value={filtered.includes(value) ? value : ''}
          onChange={(e) => onPick(e.target.value)}
          aria-describedby={ids.count}
          className={`${inputClass} font-mono text-xs`}
        >
          {/* Without this, React selects the first option when the current model is
              not in the list, and clicking that option would not fire a change. */}
          {!filtered.includes(value) && <option value="" disabled hidden />}
          {filtered.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      ) : (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600">
          {t('ai.settings.noModelMatch')}
        </p>
      )}
      <p id={ids.count} aria-live="polite" className="text-xs text-gray-500">
        {t('ai.settings.modelCount', { shown: filtered.length, total: models.length })}
      </p>
    </div>
  );
};
