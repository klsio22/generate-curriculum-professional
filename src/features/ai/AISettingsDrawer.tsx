import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react';
import { Alert, Button, Collapse, Drawer, Form, Input, Select, Space, Typography } from 'antd';
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

  const providerOptions = Object.values(AI_PROVIDERS).map((option) => ({
    value: option.id,
    label: option.id === 'custom' || option.id === 'proxy' ? t(`ai.settings.providerName.${option.id}`) : option.label,
  }));

  const footer = (
    <div className="flex justify-end gap-2">
      <Button onClick={onClose}>{t('modal.cancel')}</Button>
      <Button type="primary" onClick={handleSave}>
        {t('ai.settings.save')}
      </Button>
    </div>
  );

  return (
    <Drawer open onClose={onClose} title={t('ai.settings.title')} footer={footer} size={480} placement="right">
      <Form layout="vertical" onFinish={handleSave} requiredMark={false}>
        <p className="mb-4 text-gray-600">{t('ai.settings.intro')}</p>

        <Form.Item label={t('ai.settings.provider')} htmlFor={ids.provider}>
          <Select
            id={ids.provider}
            autoFocus
            value={draft.provider}
            onChange={(provider: AIProviderId) => changeProvider(provider)}
            options={providerOptions}
          />
        </Form.Item>

        {preset.editableBaseUrl && (
          <Form.Item
            label={t('ai.settings.baseUrl')}
            htmlFor={ids.baseUrl}
            extra={
              <span id={ids.baseUrlHelp}>
                {t(draft.provider === 'proxy' ? 'ai.settings.proxyUrlHelp' : 'ai.settings.customUrlHelp')}
              </span>
            }
          >
            <Input
              id={ids.baseUrl}
              type="url"
              value={draft.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder={preset.baseUrl || 'http://localhost:11434/v1'}
              aria-describedby={ids.baseUrlHelp}
              spellCheck={false}
            />
          </Form.Item>
        )}

        <Form.Item
          label={t('ai.settings.apiKey')}
          htmlFor={ids.apiKey}
          extra={
            <span id={ids.apiKeyHelp}>
              {preset.keyUrl ? (
                <Typography.Link href={preset.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                  {t('ai.settings.getKey', { provider: preset.label })}
                  <ExternalLink size={12} aria-hidden />
                  <span className="sr-only">{t('ai.settings.opensInNewTab')}</span>
                </Typography.Link>
              ) : (
                t(keyHelpWithoutLink)
              )}
            </span>
          }
        >
          <Space.Compact className="w-full">
            <Input
              id={ids.apiKey}
              type={showKey ? 'text' : 'password'}
              value={draft.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder={preset.keyPrefix ? `${preset.keyPrefix}...` : undefined}
              autoComplete="off"
              spellCheck={false}
              status={keyHint === 'ok' ? undefined : 'warning'}
              aria-describedby={keyDescribedBy}
              aria-invalid={keyHint !== 'ok' || undefined}
            />
            <Button
              onClick={() => setShowKey((v) => !v)}
              aria-pressed={showKey}
              aria-label={showKey ? t('ai.settings.hideKey') : t('ai.settings.showKey')}
              title={showKey ? t('ai.settings.hideKey') : t('ai.settings.showKey')}
              icon={showKey ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            />
          </Space.Compact>
        </Form.Item>

        {keyHint !== 'ok' && (
          <Alert
            id={ids.apiKeyWarning}
            type="warning"
            showIcon
            role="presentation"
            className="-mt-2 mb-4"
            title={t(`ai.settings.keyFormat.${keyHint}`, { provider: preset.label, prefix: preset.keyPrefix })}
          />
        )}

        <Form.Item label={t('ai.settings.model')} htmlFor={ids.model}>
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
        </Form.Item>

        <div id={ids.privacy} className="mb-4">
          <Alert
            type="warning"
            showIcon
            role="presentation"
            title={
              <div>
                <p>{t('ai.settings.privacyShort')}</p>
                <Collapse
                  ghost
                  size="small"
                  className="-ml-4 mt-1"
                  items={[
                    {
                      key: 'privacy',
                      label: t('ai.settings.privacyMore'),
                      children: (
                        <ul className="list-disc space-y-0.5 pl-5 text-xs">
                          <li>{t('ai.settings.privacyKey')}</li>
                          <li>{t('ai.settings.privacySent')}</li>
                          <li>{t('ai.settings.privacyNotSent')}</li>
                          <li>{t('ai.settings.privacyShared')}</li>
                        </ul>
                      ),
                    },
                  ]}
                />
              </div>
            }
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button onClick={handleTest} disabled={!canTest}>
            {t('ai.settings.test')}
          </Button>
          {settings.apiKey && (
            <Button type="text" danger icon={<Trash2 size={14} aria-hidden />} onClick={handleForgetKey}>
              {t('ai.settings.forgetKey')}
            </Button>
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
      </Form>
    </Drawer>
  );
};
