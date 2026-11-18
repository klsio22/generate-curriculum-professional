import { Settings } from 'lucide-react';
import { Badge, Button } from 'antd';
import { useTranslation } from 'react-i18next';

interface AISettingsButtonProps {
  isConfigured: boolean;
  onClick: () => void;
}

export const AISettingsButton = ({ isConfigured, onClick }: AISettingsButtonProps) => {
  const { t } = useTranslation();

  return (
    <Badge dot={isConfigured} color="green" offset={[-4, 4]} className="block w-full">
      <Button
        block
        icon={<Settings size={16} aria-hidden />}
        onClick={onClick}
        aria-label={isConfigured ? t('header.aiSettingsConfigured') : t('header.aiSettings')}
      >
        {t('header.aiSettings')}
      </Button>
    </Badge>
  );
};
