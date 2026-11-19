import { ChevronDown, History, Languages, MessageSquare, ScanSearch, Sparkles } from 'lucide-react';
import { Button, Dropdown, Space, type ButtonProps, type MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ResumeLocale } from '@/types/cv';
import { useFocusReturn } from '@/shared/components/useFocusReturn';

export interface AIActionsProps {
  onTailor: () => void;
  onChat: () => void;
  onTranslate: () => void;
  onHistory: () => void;
  onAts: () => void;
  translateTo: ResumeLocale;
  size?: ButtonProps['size'];
  block?: boolean;
}

const SOFT_PURPLE =
  'border-purple-200 bg-[#F3E8FF] text-purple-800 hover:border-purple-300 hover:bg-purple-200 hover:text-purple-900';

export const AIActions = ({ onTailor, onChat, onTranslate, onHistory, onAts, translateTo, size, block }: AIActionsProps) => {
  const { t } = useTranslation();
  const { triggerRef, onOpenChange } = useFocusReturn();

  const items: MenuProps['items'] = [
    { key: 'chat', icon: <MessageSquare size={16} aria-hidden />, label: t('chat.open'), onClick: onChat },
    {
      key: 'translate',
      icon: <Languages size={16} aria-hidden />,
      label: t(`sidebar.translateTo_${translateTo === 'pt-BR' ? 'pt' : 'en'}`),
      onClick: onTranslate,
    },
    { key: 'history', icon: <History size={16} aria-hidden />, label: t('sidebar.history'), onClick: onHistory },
    { key: 'ats', icon: <ScanSearch size={16} aria-hidden />, label: t('ats.open'), onClick: onAts },
  ];

  return (
    <Space.Compact block={block}>
      <Button
        color="purple"
        variant="filled"
        size={size}
        block={block}
        icon={<Sparkles size={16} aria-hidden />}
        onClick={onTailor}
        className={`${SOFT_PURPLE} border-r-purple-300`}
      >
        {t('ai.tailor.open')}
      </Button>
      <Dropdown trigger={['click']} placement="bottomRight" menu={{ items }} autoFocus onOpenChange={onOpenChange}>
        <Button
          ref={triggerRef}
          color="purple"
          variant="filled"
          size={size}
          aria-label={t('chat.moreActions')}
          title={t('chat.moreActions')}
          icon={<ChevronDown size={16} aria-hidden />}
          className={`border-l-purple-300 ${SOFT_PURPLE}`}
        />
      </Dropdown>
    </Space.Compact>
  );
};
