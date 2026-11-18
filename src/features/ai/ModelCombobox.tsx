import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AutoComplete, Button, Checkbox, Spin, Tag, type AutoCompleteProps } from 'antd';
import { Check, RotateCw } from 'lucide-react';
import type { ModelInfo } from './client';
import { describeAIError, type AIErrorDescription } from './errorMessage';
import type { AIProviderId } from './types';

interface ModelComboboxProps {
  id: string;
  value: string;
  onChange: (model: string) => void;
  loadModels: (signal: AbortSignal) => Promise<ModelInfo[]>;
  sourceKey: string;
  provider: AIProviderId;
  placeholder?: string;
  describedBy?: string;
}

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; key: string; models: ModelInfo[] }
  | { kind: 'error'; key: string; error: AIErrorDescription };

const LIST_HEIGHT = 320;

const groupByVendor = (models: ModelInfo[]) => {
  const groups = new Map<string, ModelInfo[]>();
  for (const model of models) {
    const key = model.vendor ?? '';
    groups.set(key, [...(groups.get(key) ?? []), model]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([vendor, list]) => ({ vendor: vendor || undefined, models: list }));
};

const matches = (model: ModelInfo, terms: string[]) => {
  const text = `${model.id} ${model.name ?? ''} ${model.label}`.toLowerCase();
  return terms.every((term) => text.includes(term));
};

export const ModelCombobox = ({
  id,
  value,
  onChange,
  loadModels,
  sourceKey,
  provider,
  placeholder,
  describedBy,
}: ModelComboboxProps) => {
  const { t, i18n } = useTranslation();
  const abortRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);

  const models = useMemo(() => (state.kind === 'ready' ? state.models : []), [state]);
  const hasFreeModels = models.some((model) => model.free);
  const selected = models.find((model) => model.id === value);
  const formatSize = useMemo(() => new Intl.NumberFormat(i18n.language, { notation: 'compact' }), [i18n.language]);
  const contextText = (model: ModelInfo) =>
    model.contextLength ? t('ai.settings.modelContext', { size: formatSize.format(model.contextLength) }) : null;

  const load = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: 'loading' });
    loadModels(controller.signal).then(
      (list) => setState({ kind: 'ready', key: sourceKey, models: list }),
      (error) => {
        if (!controller.signal.aborted) setState({ kind: 'error', key: sourceKey, error: describeAIError(error, t, provider) });
      },
    );
  }, [loadModels, sourceKey, t, provider]);

  useEffect(() => {
    queueMicrotask(load);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const terms = (query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    return models.filter((model) => (!freeOnly || model.free) && matches(model, terms));
  }, [models, query, freeOnly]);

  const optionContent = (model: ModelInfo) => {
    const isSelected = model.id === value;
    const context = contextText(model);
    return (
      <div className="py-0.5">
        <div className="flex items-center gap-2">
          <span className={`truncate ${isSelected ? 'font-semibold text-indigo-900' : 'font-medium'}`}>{model.label}</span>
          {model.free && !freeOnly && (
            <Tag color="success" className="m-0 shrink-0">
              {t('ai.settings.modelFree')}
            </Tag>
          )}
          {isSelected && <Check size={16} className="ml-auto shrink-0 text-indigo-600" aria-hidden />}
        </div>
        <div className="mt-0.5 flex gap-3 text-xs text-gray-500">
          <span className="truncate font-mono text-[11px]">{model.id}</span>
          {context && <span className="ml-auto shrink-0">{context}</span>}
        </div>
      </div>
    );
  };

  const renderOption = (model: ModelInfo) => ({
    value: model.id,
    label: model.id,
    title: [model.vendor, model.label, contextText(model)].filter(Boolean).join(' · '),
    model,
  });

  const groups = groupByVendor(filtered);
  const showVendors = groups.length > 1 || Boolean(groups[0]?.vendor);
  const options: AutoCompleteProps['options'] = showVendors
    ? groups.map((group) => ({
        label: <span className="text-xs font-semibold uppercase tracking-wide">{group.vendor ?? t('ai.settings.otherVendor')}</span>,
        title: group.vendor ?? t('ai.settings.otherVendor'),
        options: group.models.map(renderOption),
      }))
    : filtered.map(renderOption);

  const emptyContent = (() => {
    if (state.kind === 'loading' || state.kind === 'idle') {
      return (
        <span className="flex items-center gap-2 p-2 text-gray-600">
          <Spin size="small" />
          {t('ai.settings.loadingModels')}
        </span>
      );
    }
    if (state.kind === 'error') {
      return (
        <div className="space-y-2 p-2 text-sm text-red-800">
          <p>{state.error.message}</p>
          <Button size="small" icon={<RotateCw size={14} aria-hidden />} onMouseDown={(e) => e.preventDefault()} onClick={load}>
            {t('ai.settings.retryModels')}
          </Button>
        </div>
      );
    }
    return <p className="p-2 text-gray-600">{models.length === 0 ? t('ai.settings.noModels') : t('ai.settings.noModelMatch')}</p>;
  })();

  return (
    <div>
      <AutoComplete
        id={id}
        value={value}
        open={open}
        options={state.kind === 'ready' ? options : []}
        notFoundContent={emptyContent}
        listHeight={LIST_HEIGHT}
        optionRender={(option) => {
          const model = (option.data as { model?: ModelInfo }).model;
          return model ? optionContent(model) : option.label;
        }}
        defaultActiveFirstOption
        placeholder={placeholder}
        aria-describedby={describedBy}
        className="w-full"
        showSearch={{ filterOption: false, onSearch: (text) => setQuery(text) }}
        onChange={(text) => onChange(text)}
        onSelect={() => setQuery(null)}
        onOpenChange={(next) => {
          if (next) {
            setQuery(null);
            const stale = state.kind === 'idle' || (state.kind !== 'loading' && state.key !== sourceKey);
            if (stale) load();
          }
          setOpen(next);
        }}
        popupRender={(menu) => (
          <>
            {menu}
            {state.kind === 'ready' && models.length > 0 && (
              <p className="border-t border-gray-100 px-3 pt-1.5 text-xs text-gray-500" aria-hidden>
                {t('ai.settings.modelCount', { shown: filtered.length, total: models.length })}
              </p>
            )}
          </>
        )}
      />

      {selected && (
        <p className="mt-1 text-xs text-gray-600">
          {[selected.vendor, selected.label, contextText(selected), selected.free ? t('ai.settings.modelFree') : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {hasFreeModels && (
        <Checkbox className="mt-2" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)}>
          {t('ai.settings.freeOnly')}
        </Checkbox>
      )}

      <p className="sr-only" aria-live="polite">
        {open && state.kind === 'ready' ? t('ai.settings.modelCount', { shown: filtered.length, total: models.length }) : ''}
      </p>
    </div>
  );
};
