import { Sparkles } from 'lucide-react';
import { Button, type ButtonProps } from 'antd';
import { useTranslation } from 'react-i18next';

interface TailorButtonProps {
  onClick: () => void;
  size?: ButtonProps['size'];
  block?: boolean;
}

export const TailorButton = ({ onClick, size, block }: TailorButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      color="purple"
      variant="filled"
      size={size}
      block={block}
      icon={<Sparkles size={16} aria-hidden />}
      onClick={onClick}
      className="border-purple-200 bg-[#F3E8FF] text-purple-800 hover:border-purple-300 hover:bg-purple-200 hover:text-purple-900"
    >
      {t('ai.tailor.open')}
    </Button>
  );
};
