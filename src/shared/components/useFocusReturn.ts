import { useCallback, useRef } from 'react';

export const useFocusReturn = <T extends HTMLElement = HTMLButtonElement>() => {
  const triggerRef = useRef<T>(null);
  const onOpenChange = useCallback((open: boolean) => {
    if (open) return;
    setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
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
