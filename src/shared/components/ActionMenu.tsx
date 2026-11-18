import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Red text, for actions that delete something. */
  danger?: boolean;
}

interface ActionMenuProps {
  /** Accessible name of the ⋯ button, e.g. "Actions for Resume X". */
  label: string;
  items: ActionMenuItem[];
  /** Colors for the ⋯ button (the menu itself is always light). */
  triggerClassName?: string;
}

const MENU_HEIGHT_GUESS = 240;

/**
 * "⋯" button that opens a list of actions (ARIA menu button pattern):
 * arrows move between items, Home/End jump, Escape closes and returns focus
 * to the button. The menu opens upward when there is no room below.
 */
export const ActionMenu = ({ label, items, triggerClassName = '' }: ActionMenuProps) => {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);

  const enabledIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));

  const focusItem = (index: number | undefined) => {
    if (index !== undefined) itemRefs.current[index]?.focus();
  };

  const openMenu = (focus: 'first' | 'last' = 'first') => {
    const rect = triggerRef.current?.getBoundingClientRect();
    // Open upward when the space below (inside the window) is too small.
    setOpenUp(rect ? window.innerHeight - rect.bottom < MENU_HEIGHT_GUESS && rect.top > MENU_HEIGHT_GUESS : false);
    setOpen(true);
    requestAnimationFrame(() => focusItem(focus === 'first' ? enabledIndexes[0] : enabledIndexes.at(-1)));
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((element) => element === document.activeElement);
    const position = enabledIndexes.indexOf(current);
    const move = (step: number) => {
      const next = (position + step + enabledIndexes.length) % enabledIndexes.length;
      focusItem(enabledIndexes[next]);
    };
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(enabledIndexes[0]);
        break;
      case 'End':
        event.preventDefault();
        focusItem(enabledIndexes.at(-1));
        break;
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openMenu('first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openMenu('last');
          }
        }}
        className={`rounded p-1.5 ${triggerClassName}`}
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          className={`absolute right-0 z-40 w-52 rounded-md border border-gray-200 bg-white py-1 text-sm text-gray-800 shadow-xl ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                item.danger ? 'text-red-700' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
