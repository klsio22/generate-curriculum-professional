import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react';
import { Drawer } from '@/shared/components/Drawer';
import { StatusAlert } from '@/shared/components/StatusAlert';
import { listModels, testConnection } from './client';
import { describeAIError } from './errorMessage';
import { ModelCombobox } from './ModelCombobox';
import { AI_PROVIDERS, checkKeyFormat } from './providers';
import type { AIProviderId, AISettings } from './types';

interface AISettingsDialogProps {
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  onForgetKey: () => void;
  onClose: () => void;
}

interface AISettingsDrawerProps extends AISettingsDialogProps {
  isOpen: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string; detail?: string };

const inputClass =
  'block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500';

/** Mounted only while open, so every opening starts from the saved settings. */
export const AISettingsDrawer = ({ isOpen, ...props }: AISettingsDrawerProps) =>
  isOpen ? <AISettingsDialog {...props} /> : null;

const AISettingsDialog = ({
  settings,
  onSave,
  onForgetKey,
  onClose,
}: AISettingsDialogProps) => {
  const { t } = useTranslation();
  const ids = {
    provider: useId(),
    baseUrl: useId(),
    baseUrlHelp: useId(),
    apiKey: useId(),
    apiKeyHelp: useId(),
    apiKeyWarning: useId(),
    model: useId(),
    modelHelp: useId(),
    privacy: useId(),
  };

  const [draft, setDraft] = useState<AISettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any request still running when the dialog closes.
  useEffect(() => () => abortRef.current?.abort(), []);

  const preset = AI_PROVIDERS[draft.provider];
  const keyHint = checkKeyFormat(draft.provider, draft.apiKey);
  const busy = status.kind === 'busy';

  const update = (patch: Partial<AISettings>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setStatus({ kind: 'idle' });
  };

  const changeProvider = (provider: AIProviderId) => {
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
      if (!controller.signal.aborted) setStatus({ kind: 'error', ...describeAIError(error, t, draft.provider) });
    }
  };

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
  const keyDescribedBy = [keyHint === 'ok' ? '' : ids.apiKeyWarning, ids.apiKeyHelp, ids.privacy]
    .filter(Boolean)
    .join(' ');
  const keyHelpWithoutLink = draft.provider === 'proxy' ? 'ai.settings.proxyKeyHelp' : 'ai.settings.customKeyHelp';

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
    <Drawer isOpen title={t('ai.settings.title')} onClose={onClose} footer={footer}>
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
                {option.id === 'custom' || option.id === 'proxy'
                  ? t(`ai.settings.providerName.${option.id}`)
                  : option.label}
              </option>
            ))}
          </select>
        </div>

        {preset.editableBaseUrl && (
          <div>
            <label htmlFor={ids.baseUrl} className="block text-sm font-medium text-gray-700 mb-1">
              {t('ai.settings.baseUrl')}
            </label>
            <input
              id={ids.baseUrl}
              type="url"
              value={draft.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder={preset.baseUrl || 'http://localhost:11434/v1'}
              aria-describedby={ids.baseUrlHelp}
              spellCheck={false}
              className={inputClass}
            />
            <p id={ids.baseUrlHelp} className="mt-1 text-xs text-gray-500">
              {t(draft.provider === 'proxy' ? 'ai.settings.proxyUrlHelp' : 'ai.settings.customUrlHelp')}
            </p>
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
              placeholder={preset.keyPrefix ? `${preset.keyPrefix}...` : undefined}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={keyDescribedBy}
              aria-invalid={keyHint !== 'ok' || undefined}
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
          {keyHint !== 'ok' && (
            <p
              id={ids.apiKeyWarning}
              className="mt-2 flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {t(`ai.settings.keyFormat.${keyHint}`, {
                provider: preset.label,
                prefix: preset.keyPrefix,
              })}
            </p>
          )}
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
              t(keyHelpWithoutLink)
            )}
          </p>
        </div>

        <div>
          <label htmlFor={ids.model} className="block text-sm font-medium text-gray-700 mb-1">
            {t('ai.settings.model')}
          </label>
          <ModelCombobox
            id={ids.model}
            value={draft.model}
            onChange={(model) => update({ model })}
            loadModels={(signal) => listModels(draft, { signal })}
            sourceKey={`${draft.provider}|${draft.baseUrl}|${draft.apiKey}`}
            provider={draft.provider}
            placeholder={t('ai.settings.modelPlaceholder', { example: preset.modelExample })}
            describedBy={ids.modelHelp}
          />
          <p id={ids.modelHelp} className="sr-only">
            {t('ai.settings.modelHelp')}
          </p>
        </div>

        <div
          id={ids.privacy}
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          <p>{t('ai.settings.privacyShort')}</p>
          <details className="mt-1">
            <summary className="cursor-pointer font-medium underline">{t('ai.settings.privacyMore')}</summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>{t('ai.settings.privacyKey')}</li>
              <li>{t('ai.settings.privacySent')}</li>
              <li>{t('ai.settings.privacyNotSent')}</li>
              <li>{t('ai.settings.privacyShared')}</li>
            </ul>
          </details>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={!canTest}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('ai.settings.test')}
          </button>
          {settings.apiKey && (
            <button
              type="button"
              onClick={handleForgetKey}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:text-red-700 hover:underline"
            >
              <Trash2 size={14} aria-hidden />
              {t('ai.settings.forgetKey')}
            </button>
          )}
        </div>

        <div aria-live="polite" role="status">
          {status.kind === 'busy' && <StatusAlert tone="busy">{status.message}</StatusAlert>}
          {status.kind === 'success' && <StatusAlert tone="success">{status.message}</StatusAlert>}
          {status.kind === 'error' && (
            <StatusAlert tone="error" detail={status.detail}>
              {status.message}
            </StatusAlert>
          )}
        </div>
      </form>
    </Drawer>
  );
};
