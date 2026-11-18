import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FileText,
  GripVertical,
  Menu,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SavedCV } from '@/types/cv';
import { ActionMenu } from '@/shared/components/ActionMenu';

interface SidebarProps {
  cvs: SavedCV[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onRequestDelete: (id: string) => void;
  onRequestClear: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

/** Amber for AI-tailored resumes, indigo for the open one, grey for the rest. */
const iconColor = (isAI: boolean, isActive: boolean) => {
  if (isAI) return 'text-amber-300';
  return isActive ? 'text-indigo-400' : 'text-gray-400';
};

/** Items only move up and down. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export const Sidebar: React.FC<SidebarProps> = ({
  cvs,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onRename,
  onMove,
  onRequestDelete,
  onRequestClear,
  isOpen,
  toggleSidebar,
}) => {
  const { t, i18n } = useTranslation();
  const asideRef = React.useRef<HTMLElement | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState('');
  const dateLocale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';

  React.useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (!isOpen) return;
      const target = e.target as Node | null;
      if (asideRef.current && target && !asideRef.current.contains(target)) {
        toggleSidebar();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, toggleSidebar]);

  const sensors = useSensors(
    // A small distance keeps a simple click on the handle from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const describe = (id: UniqueIdentifier | undefined) => {
    const index = cvs.findIndex((cv) => cv.id === id);
    return { title: cvs[index]?.title ?? '', position: index + 1, total: cvs.length };
  };

  // Screen reader messages while dragging, in the app's language.
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('sidebar.dnd.pickedUp', describe(active.id)),
    onDragOver: ({ active, over }) =>
      over ? t('sidebar.dnd.over', { ...describe(over.id), title: describe(active.id).title }) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t('sidebar.dnd.dropped', { ...describe(over.id), title: describe(active.id).title }) : undefined,
    onDragCancel: ({ active }) => t('sidebar.dnd.cancelled', describe(active.id)),
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(String(active.id), cvs.findIndex((cv) => cv.id === over.id));
  };

  const moveBy = (cv: SavedCV, index: number, step: number) => {
    const target = index + step;
    onMove(cv.id, target);
    setAnnouncement(t('sidebar.movedTo', { title: cv.title, position: target + 1, total: cvs.length }));
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <button
          type="button"
          aria-label={t('sidebar.closeSidebar')}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Handle button visible when sidebar is closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('sidebar.openSidebar')}
          title={t('sidebar.openSidebar')}
          className="fixed left-0 top-28 lg:top-6 z-40 bg-gray-900 text-white p-2 rounded-r-md shadow-md"
        >
          <Menu size={20} aria-hidden />
        </button>
      )}

      <aside
        ref={asideRef}
        aria-label={t('sidebar.title')}
        // Off screen when closed: keep it out of the Tab order and away from screen readers.
        inert={!isOpen}
        className={`fixed inset-y-0 left-0 bg-gray-900 text-white w-72 transform transition-transform duration-200 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{t('sidebar.title')}</h2>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={t('sidebar.closeSidebar')}
              title={t('sidebar.closeSidebar')}
              className="p-2 rounded hover:bg-gray-800"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={onCreate}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors mb-4"
          >
            <Plus size={20} aria-hidden />
            {t('sidebar.newCV')}
          </button>

          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements, screenReaderInstructions: { draggable: t('sidebar.dnd.instructions') } }}
          >
            <SortableContext items={cvs.map((cv) => cv.id)} strategy={verticalListSortingStrategy}>
              <ul aria-label={t('sidebar.listLabel')} className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1 pb-2">
                {cvs.map((cv, index) => (
                  <SortableResumeItem
                    key={cv.id}
                    cv={cv}
                    isActive={activeId === cv.id}
                    isRenaming={renamingId === cv.id}
                    dateLocale={dateLocale}
                    onSelect={() => onSelect(cv.id)}
                    onRenameDone={(title) => {
                      setRenamingId(null);
                      if (title !== null && title.trim() && title.trim() !== cv.title) onRename(cv.id, title.trim());
                    }}
                    menuItems={[
                      { label: t('sidebar.rename'), icon: <Pencil size={16} aria-hidden />, onSelect: () => setRenamingId(cv.id) },
                      { label: t('sidebar.duplicate'), icon: <Copy size={16} aria-hidden />, onSelect: () => onDuplicate(cv.id) },
                      {
                        label: t('sidebar.moveUp'),
                        icon: <ArrowUp size={16} aria-hidden />,
                        onSelect: () => moveBy(cv, index, -1),
                        disabled: index === 0,
                      },
                      {
                        label: t('sidebar.moveDown'),
                        icon: <ArrowDown size={16} aria-hidden />,
                        onSelect: () => moveBy(cv, index, 1),
                        disabled: index === cvs.length - 1,
                      },
                      {
                        label: t('sidebar.delete'),
                        icon: <Trash2 size={16} aria-hidden />,
                        onSelect: () => onRequestDelete(cv.id),
                        danger: true,
                      },
                    ]}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <div className="mt-auto flex flex-col items-center gap-2 border-t border-gray-800 pt-4 text-xs text-gray-400">
            <span>{t('sidebar.saved', { count: cvs.length })}</span>
            <button
              type="button"
              onClick={onRequestClear}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-300 hover:bg-gray-800 hover:text-red-200 hover:underline"
            >
              <Trash2 size={14} aria-hidden />
              {t('sidebar.clearData')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface SortableResumeItemProps {
  cv: SavedCV;
  isActive: boolean;
  isRenaming: boolean;
  dateLocale: string;
  onSelect: () => void;
  /** New title, or null when renaming was cancelled. */
  onRenameDone: (title: string | null) => void;
  menuItems: React.ComponentProps<typeof ActionMenu>['items'];
}

const SortableResumeItem = ({
  cv,
  isActive,
  isRenaming,
  dateLocale,
  onSelect,
  onRenameDone,
  menuItems,
}: SortableResumeItemProps) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: cv.id,
  });
  const isAI = Boolean(cv.meta?.createdByAI);
  const subtitle = isAI ? cv.meta?.company : undefined;
  const Icon = isAI ? Sparkles : FileText;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative flex items-start gap-1 rounded border-l-4 py-2 pl-1 pr-1 transition-colors ${
        isActive ? 'border-indigo-500 bg-gray-800' : 'border-transparent hover:bg-gray-800'
      } ${isDragging ? 'z-10 shadow-lg ring-1 ring-indigo-400 bg-gray-800' : ''}`}
    >
      {/* Drag handle: desktop only (the list is a full-screen overlay on small screens; there the menu moves items). */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('sidebar.dragHandle', { title: cv.title })}
        title={t('sidebar.dragHandle', { title: cv.title })}
        className="mt-0.5 hidden cursor-grab touch-none rounded p-1 text-gray-500 opacity-60 hover:bg-gray-700 hover:text-gray-200 hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing lg:block"
      >
        <GripVertical size={16} aria-hidden />
      </button>

      {isRenaming ? (
        <RenameField title={cv.title} onDone={onRenameDone} />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          aria-current={isActive ? 'true' : undefined}
          className="flex min-w-0 flex-1 items-start gap-2 rounded p-1 text-left"
        >
          <Icon
            size={18}
            aria-hidden
            className={`mt-0.5 shrink-0 ${iconColor(isAI, isActive)}`}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="line-clamp-2 text-sm font-medium leading-snug">{cv.title}</span>
            {isAI && <span className="sr-only">{t('sidebar.aiTailored')}</span>}
            {subtitle && <span className="truncate text-xs text-gray-300">{subtitle}</span>}
            <span className="text-xs text-gray-500">{new Date(cv.updatedAt).toLocaleDateString(dateLocale)}</span>
          </span>
        </button>
      )}

      <ActionMenu
        label={t('sidebar.actionsFor', { title: cv.title })}
        items={menuItems}
        triggerClassName="text-gray-400 hover:bg-gray-700 hover:text-white"
      />
    </li>
  );
};

/** Inline field to rename a resume: Enter or leaving the field saves, Escape cancels. */
const RenameField = ({ title, onDone }: { title: string; onDone: (title: string | null) => void }) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const doneRef = React.useRef(false);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (value: string | null) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={title}
      aria-label={t('sidebar.renameLabel', { title })}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(event.currentTarget.value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(null);
        }
      }}
      onBlur={(event) => finish(event.currentTarget.value)}
      className="min-w-0 flex-1 rounded border border-indigo-400 bg-gray-950 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
    />
  );
};
