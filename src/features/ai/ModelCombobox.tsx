import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Loader2, RotateCw } from 'lucide-react';
import type { ModelInfo } from './client';
import { describeAIError, type AIErrorDescription } from './errorMessage';
import type { AIProviderId } from './types';

interface ModelComboboxProps {
  id: string;
  value: string;
  onChange: (model: string) => void;
  /** Loads the provider's models; called the first time the list opens and when `sourceKey` changes. */
  loadModels: (signal: AbortSignal) => Promise<ModelInfo[]>;
  /** Changes when the provider, address or key change, so the list is loaded again. */
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

interface Group {
  vendor?: string;
  models: ModelInfo[];
}

interface Popup {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

const MAX_LIST_HEIGHT = 320;

/** Groups by vendor (alphabetical), keeping the id order inside each group. */
const groupByVendor = (models: ModelInfo[]): Group[] => {
  const groups = new Map<string, ModelInfo[]>();
  for (const model of models) {
    const key = model.vendor ?? '';
    groups.set(key, [...(groups.get(key) ?? []), model]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([vendor, list]) => ({ vendor: vendor || undefined, models: list }));
};

/** Selected: lilac background and border; under the keyboard or mouse: grey background and an outline. */
const optionClass = (isSelected: boolean, isActive: boolean) => {
  if (isSelected) return `border-indigo-300 bg-indigo-50 ${isActive ? 'outline outline-2 -outline-offset-2 outline-indigo-400' : ''}`;
  if (isActive) return 'border-transparent bg-gray-100 outline outline-2 -outline-offset-2 outline-indigo-400';
  return 'border-transparent';
};

const matches = (model: ModelInfo, terms: string[]) => {
  const text = `${model.id} ${model.name ?? ''} ${model.label}`.toLowerCase();
  return terms.every((term) => text.includes(term));
};

/**
 * One field to type or pick the model (ARIA combobox pattern): typing filters
 * the list, arrows move, Enter picks, Escape closes the list (not the dialog).
 * The list opens over the dialog, so the dialog itself does not need to scroll.
 */
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
  const listId = useId();
  const countId = useId();
  const freeId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [open, setOpen] = useState(false);
  /** Text typed since the list opened; null shows the whole list. */
  const [query, setQuery] = useState<string | null>(null);
  /** Option under the keyboard or mouse; null means "the selected model, or the first one". */
  const [activeId, setActiveId] = useState<string | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [popup, setPopup] = useState<Popup | null>(null);

  const models = useMemo(() => (state.kind === 'ready' ? state.models : []), [state]);
  const hasFreeModels = models.some((model) => model.free);
  const selected = models.find((model) => model.id === value);
  const formatSize = useMemo(() => new Intl.NumberFormat(i18n.language, { notation: 'compact' }), [i18n.language]);

  const groups = useMemo(() => {
    const terms = (query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    return groupByVendor(models.filter((model) => (!freeOnly || model.free) && matches(model, terms)));
  }, [models, query, freeOnly]);
  const options = useMemo(() => groups.flatMap((group) => group.models), [groups]);
  const showVendors = groups.length > 1 || Boolean(groups[0]?.vendor);
  const optionId = (index: number) => `${listId}-option-${index}`;

  const activeIndex = (() => {
    const active = activeId ? options.findIndex((model) => model.id === activeId) : -1;
    if (active >= 0) return active;
    const current = query === null ? options.findIndex((model) => model.id === value) : -1;
    return Math.max(current, 0);
  })();
  const moveActive = (step: number) => {
    const next = Math.min(Math.max(activeIndex + step, 0), options.length - 1);
    if (options[next]) setActiveId(options[next].id);
  };

  const load = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: 'loading' });
    loadModels(controller.signal).then(
      (list) => setState({ kind: 'ready', key: sourceKey, models: list }),
      (error) => {
        if (!controller.signal.aborted) {
          setState({ kind: 'error', key: sourceKey, error: describeAIError(error, t, provider) });
        }
      },
    );
  }, [loadModels, sourceKey, t, provider]);

  // Load once when the dialog opens, so the selected model's name and the free filter show up
  // right away. Errors stay quiet here and are shown when the user opens the list.
  useEffect(() => {
    queueMicrotask(load);
    return () => abortRef.current?.abort();
    // only on mount: later loads happen when the list opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openList = () => {
    if (open) return;
    const stale = state.kind === 'idle' || (state.kind !== 'loading' && state.key !== sourceKey);
    if (stale) load();
    setQuery(null);
    setActiveId(null);
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setQuery(null);
  };

  const pick = (model: ModelInfo) => {
    onChange(model.id);
    closeList();
  };

  // Keep the active option in view. Runs again once the list is placed on screen,
  // so the selected model is visible as soon as the list opens.
  const popupPlaced = popup !== null;
  useEffect(() => {
    if (!open || !popupPlaced) return;
    document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on listId, which never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, popupPlaced, activeIndex, state.kind]);

  // Place the list under the field (or above it, when there is no room below).
  useLayoutEffect(() => {
    if (!open) return;
    const place = (event?: Event) => {
      // Scrolling inside the list does not move the field.
      if (event && popupRef.current?.contains(event.target as Node)) return;
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const openUp = below < 200 && above > below;
      const maxHeight = Math.min(MAX_LIST_HEIGHT, openUp ? above : below);
      setPopup(
        openUp
          ? { left: rect.left, width: rect.width, maxHeight, bottom: window.innerHeight - rect.top + 4 }
          : { left: rect.left, width: rect.width, maxHeight, top: rect.bottom + 4 },
      );
    };
    place();
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', onResize);
      setPopup(null);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) moveActive(-1);
        break;
      case 'Enter':
        if (!open) return;
        // Pick instead of submitting the form.
        event.preventDefault();
        if (options[activeIndex]) pick(options[activeIndex]);
        else closeList();
        break;
      case 'Escape':
        if (!open) return;
        // Close only the list, not the dialog.
        event.preventDefault();
        event.stopPropagation();
        closeList();
        break;
      case 'Tab':
        closeList();
        break;
    }
  };

  const contextText = (model: ModelInfo) =>
    model.contextLength ? t('ai.settings.modelContext', { size: formatSize.format(model.contextLength) }) : null;

  let index = -1;

  return (
    <div>
      <div ref={anchorRef} className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && options[activeIndex] ? optionId(activeIndex) : undefined}
          aria-describedby={describedBy}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            onChange(event.target.value);
            if (!open) openList();
            // After openList, which clears the query; a new filter starts on the first match.
            setQuery(event.target.value);
            setActiveId(null);
          }}
          onClick={() => (open ? closeList() : openList())}
          onKeyDown={handleKeyDown}
          onBlur={closeList}
          className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('ai.settings.showModels')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            document.getElementById(id)?.focus();
            if (open) closeList();
            else openList();
          }}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
        >
          <ChevronDown size={18} aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {selected && (
        <p className="mt-1 text-xs text-gray-600">
          {[selected.vendor, selected.label].filter(Boolean).join(' · ')}
          {contextText(selected) && ` · ${contextText(selected)}`}
          {selected.free && ` · ${t('ai.settings.modelFree')}`}
        </p>
      )}

      {hasFreeModels && (
        <label htmlFor={freeId} className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            id={freeId}
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          {t('ai.settings.freeOnly')}
        </label>
      )}

      <p id={countId} className="sr-only" aria-live="polite">
        {open && state.kind === 'ready' ? t('ai.settings.modelCount', { shown: options.length, total: models.length }) : ''}
      </p>

      {open && popup && (
        <div
          ref={popupRef}
          className="fixed z-30 flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl"
          style={{ left: popup.left, width: popup.width, top: popup.top, bottom: popup.bottom, maxHeight: popup.maxHeight }}
          // Keep the focus in the field while the mouse is used in the list.
          onMouseDown={(event) => event.preventDefault()}
        >
          {state.kind === 'loading' && (
            <p className="flex items-center gap-2 p-3 text-sm text-gray-600">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              {t('ai.settings.loadingModels')}
            </p>
          )}

          {state.kind === 'error' && (
            <div className="space-y-2 p-3 text-sm text-red-800">
              <p>{state.error.message}</p>
              <button
                type="button"
                tabIndex={-1}
                onClick={load}
                className="inline-flex items-center gap-1 text-indigo-700 underline"
              >
                <RotateCw size={14} aria-hidden />
                {t('ai.settings.retryModels')}
              </button>
            </div>
          )}

          {state.kind === 'ready' && options.length === 0 && (
            <p className="p-3 text-sm text-gray-600">
              {models.length === 0 ? t('ai.settings.noModels') : t('ai.settings.noModelMatch')}
            </p>
          )}

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={t('ai.settings.modelList')}
            className="min-h-0 flex-1 overflow-y-auto py-1"
          >
            {state.kind === 'ready' &&
              groups.map((group, groupIndex) => {
                const headingId = `${listId}-group-${groupIndex}`;
                return (
                  <li key={group.vendor ?? ''} role="group" aria-labelledby={showVendors ? headingId : undefined}>
                    {showVendors && (
                      <div
                        id={headingId}
                        role="presentation"
                        className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {group.vendor ?? t('ai.settings.otherVendor')}
                      </div>
                    )}
                    <ul role="none">
                      {group.models.map((model) => {
                        index += 1;
                        const optionIndex = index;
                        const isSelected = model.id === value;
                        const isActive = optionIndex === activeIndex;
                        const context = contextText(model);
                        return (
                          <li
                            key={model.id}
                            id={optionId(optionIndex)}
                            role="option"
                            aria-selected={isSelected}
                            title={model.id}
                            onClick={() => pick(model)}
                            onMouseMove={() => !isActive && setActiveId(model.id)}
                            className={`mx-1 cursor-pointer rounded-md border px-3 py-2 ${showVendors ? 'scroll-mt-8' : ''} ${optionClass(isSelected, isActive)}`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`truncate text-sm ${isSelected ? 'font-semibold text-indigo-900' : 'font-medium text-gray-900'}`}
                              >
                                {model.label}
                              </span>
                              {model.free && !freeOnly && (
                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  {t('ai.settings.modelFree')}
                                </span>
                              )}
                              {isSelected && <Check size={16} className="ml-auto shrink-0 text-indigo-600" aria-hidden />}
                            </span>
                            <span className="mt-0.5 flex gap-3 text-xs text-gray-500">
                              <span className="truncate font-mono text-[11px]">{model.id}</span>
                              {context && <span className="ml-auto shrink-0">{context}</span>}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
          </ul>

          {state.kind === 'ready' && models.length > 0 && (
            <p className="border-t border-gray-100 px-3 py-1.5 text-xs text-gray-500" aria-hidden>
              {t('ai.settings.modelCount', { shown: options.length, total: models.length })}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
