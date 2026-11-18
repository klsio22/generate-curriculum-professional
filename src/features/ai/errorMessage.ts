import type { TFunction } from 'i18next';
import { AIError } from './client';
import { AI_PROVIDERS } from './providers';
import type { AIProviderId } from './types';

export interface AIErrorDescription {
  /** What happened and what to do, in the user's language. */
  message: string;
  /** The provider's own message (often in English), shown only under "Technical details". */
  detail?: string;
}

/** Turns any error from the AI flow into a message the user can act on. */
export const describeAIError = (error: unknown, t: TFunction, provider?: AIProviderId): AIErrorDescription => {
  if (!(error instanceof AIError)) return { message: t('ai.errors.unknown') };

  // For a server on this computer, the usual cause is that it is not running.
  if (error.code === 'network' && provider && AI_PROVIDERS[provider].local) {
    return { message: t('ai.errors.network_local'), detail: error.detail };
  }

  let message = t(`ai.errors.${error.code}`);
  const preset = provider ? AI_PROVIDERS[provider] : undefined;
  if (error.code === 'invalid_key' && preset?.keyPrefix) {
    message += ` ${t('ai.errors.keyPrefixHint', { provider: preset.label, prefix: preset.keyPrefix })}`;
  }
  const detail = [error.status ? `HTTP ${error.status}` : '', error.detail ?? ''].filter(Boolean).join(': ');
  return { message, detail: detail || undefined };
};
