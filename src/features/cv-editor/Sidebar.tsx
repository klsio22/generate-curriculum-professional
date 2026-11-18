import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FileText,
  GripVertical,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button, ConfigProvider, Drawer, Dropdown, Input, Typography, theme, type InputRef, type MenuProps } from 'antd';
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
import { BRAND } from '@/app/AntdProvider';
import { useFocusReturn } from '@/shared/components/useFocusReturn';

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

const iconColor = (isAI: boolean, isActive: boolean) => {
  if (isAI) return 'text-amber-300';
  return isActive ? 'text-indigo-400' : 'text-gray-400';
};

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
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState('');
  const dateLocale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const describe = (id: UniqueIdentifier | undefined) => {
    const index = cvs.findIndex((cv) => cv.id === id);
    return { title: cvs[index]?.title ?? '', position: index + 1, total: cvs.length };
  };

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

  const menuItemsFor = (cv: SavedCV, index: number): MenuProps['items'] => [
    { key: 'rename', icon: <Pencil size={16} aria-hidden />, label: t('sidebar.rename'), onClick: () => setRenamingId(cv.id) },
    { key: 'duplicate', icon: <Copy size={16} aria-hidden />, label: t('sidebar.duplicate'), onClick: () => onDuplicate(cv.id) },
    {
      key: 'up',
      icon: <ArrowUp size={16} aria-hidden />,
      label: t('sidebar.moveUp'),
      disabled: index === 0,
      onClick: () => moveBy(cv, index, -1),
    },
    {
      key: 'down',
      icon: <ArrowDown size={16} aria-hidden />,
      label: t('sidebar.moveDown'),
      disabled: index === cvs.length - 1,
      onClick: () => moveBy(cv, index, 1),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <Trash2 size={16} aria-hidden />,
      label: t('sidebar.delete'),
      danger: true,
      onClick: () => onRequestDelete(cv.id),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        onClick={toggleSidebar}
        aria-label={t('sidebar.openSidebar')}
        aria-expanded={isOpen}
        title={t('sidebar.openSidebar')}
        icon={<Menu size={20} aria-hidden />}
        className="fixed left-0 top-28 z-40 rounded-l-none bg-gray-900 shadow-md hover:bg-gray-800 lg:top-6"
      />

      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: { colorPrimary: BRAND.primary, colorPrimaryHover: '#6366f1', colorPrimaryActive: '#4f46e5' },
          components: { Button: { defaultHoverBg: '#1f2937', defaultHoverColor: '#ffffff', defaultHoverBorderColor: '#6366f1' } },
        }}
      >
        <Drawer
          open={isOpen}
          onClose={toggleSidebar}
          placement="left"
          size={288}
          title={t('sidebar.title')}
          closable={{ 'aria-label': t('sidebar.closeSidebar') }}
          styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column' } }}
          footer={
            <div className="flex flex-col items-center gap-1 py-1">
              <Typography.Text type="secondary" className="text-xs">
                {t('sidebar.saved', { count: cvs.length })}
              </Typography.Text>
              <Button type="link" danger size="small" icon={<Trash2 size={14} aria-hidden />} onClick={onRequestClear}>
                {t('sidebar.clearData')}
              </Button>
            </div>
          }
        >
          <Button type="primary" size="large" block icon={<Plus size={20} aria-hidden />} onClick={onCreate} className="mb-4">
            {t('sidebar.newCV')}
          </Button>

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
                      const newTitle = title?.trim();
                      if (newTitle && newTitle !== cv.title) onRename(cv.id, newTitle);
                    }}
                    menuItems={menuItemsFor(cv, index)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </Drawer>
      </ConfigProvider>
    </>
  );
};

interface SortableResumeItemProps {
  cv: SavedCV;
  isActive: boolean;
  isRenaming: boolean;
  dateLocale: string;
  onSelect: () => void;
  onRenameDone: (title: string | null) => void;
  menuItems: MenuProps['items'];
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
  const { triggerRef: menuTriggerRef, onOpenChange: onMenuOpenChange } = useFocusReturn();

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group relative flex items-start gap-1 rounded border-l-4 py-2 pl-1 pr-1 transition-colors ${
        isActive ? 'border-indigo-500 bg-gray-800' : 'border-transparent hover:bg-gray-800'
      } ${isDragging ? 'z-10 shadow-lg ring-1 ring-indigo-400 bg-gray-800' : ''}`}
    >
      <Button
        ref={setActivatorNodeRef}
        type="text"
        size="small"
        {...attributes}
        {...listeners}
        aria-label={t('sidebar.dragHandle', { title: cv.title })}
        title={t('sidebar.dragHandle', { title: cv.title })}
        icon={<GripVertical size={16} aria-hidden />}
        className="mt-1 hidden cursor-grab touch-none opacity-60 hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing lg:inline-flex"
      />

      {isRenaming ? (
        <RenameField title={cv.title} onDone={onRenameDone} />
      ) : (
        <Button
          type="text"
          onClick={onSelect}
          aria-current={isActive ? 'true' : undefined}
          className="h-auto min-w-0 flex-1 items-start justify-start gap-2 whitespace-normal px-1 py-1 text-left"
        >
          <Icon size={18} aria-hidden className={`mt-0.5 shrink-0 ${iconColor(isAI, isActive)}`} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="line-clamp-2 text-sm font-medium leading-snug">{cv.title}</span>
            {isAI && <span className="sr-only">{t('sidebar.aiTailored')}</span>}
            {subtitle && <span className="truncate text-xs text-gray-300">{subtitle}</span>}
            <span className="text-xs text-gray-500">{new Date(cv.updatedAt).toLocaleDateString(dateLocale)}</span>
          </span>
        </Button>
      )}

      <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: menuItems }} autoFocus onOpenChange={onMenuOpenChange}>
        <Button
          ref={menuTriggerRef}
          type="text"
          size="small"
          aria-label={t('sidebar.actionsFor', { title: cv.title })}
          title={t('sidebar.actionsFor', { title: cv.title })}
          icon={<MoreHorizontal size={18} aria-hidden />}
          className="mt-1"
        />
      </Dropdown>
    </li>
  );
};

const RenameField = ({ title, onDone }: { title: string; onDone: (title: string | null) => void }) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<InputRef>(null);
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
    <Input
      ref={inputRef}
      size="small"
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
      className="min-w-0 flex-1"
    />
  );
};
