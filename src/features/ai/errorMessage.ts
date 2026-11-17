import type { TFunction } from 'i18next';
import { AIError } from './client';

/** Turns any error from the AI flow into a message the user can act on. */
export const aiErrorMessage = (error: unknown, t: TFunction): string => {
  if (error instanceof AIError) {
    const message = t(`ai.errors.${error.code}`);
    return error.detail && error.code !== 'network' ? `${message} (${error.detail})` : message;
  }
  return t('ai.errors.unknown');
};
