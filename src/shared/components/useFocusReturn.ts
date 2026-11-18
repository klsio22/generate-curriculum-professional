import { useCallback, useRef } from 'react';

/**
 * For antd Dropdown and similar popups: when the popup closes and the focus
 * was lost (on <body> or on a now hidden popup item, e.g. after Escape), give it back to the button
 * that opened it. When an action moved the focus somewhere else on purpose
 * (a field, a dialog), it is left alone.
 */
export const useFocusReturn = <T extends HTMLElement = HTMLButtonElement>() => {
  const triggerRef = useRef<T>(null);
  const onOpenChange = useCallback((open: boolean) => {
    if (open) return;
    // Wait for the action's own focus change (e.g. an input that focuses itself).
    setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      // Lost: on <body>, removed, or still on an item of the popup that is closing
      // (antd keeps it on screen during the close animation).
      const lost =
        !active ||
        active === document.body ||
        !active.isConnected ||
        active.closest('.ant-dropdown, [role="menu"]') !== null;
      if (lost) triggerRef.current?.focus();
    }, 50);
  }, []);
  return { triggerRef, onOpenChange };
};
