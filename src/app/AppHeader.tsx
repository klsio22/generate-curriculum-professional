import type { ReactNode } from 'react';
import { Menu, PanelLeftClose } from 'lucide-react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { DownloadPdfButton } from '@/features/pdf/DownloadPdfButton';
import { LanguageSelector } from '@/shared/components/LanguageSelector';

interface AppHeaderProps {
  data: CVData;
  activeTitle: string;
  onDownloadError: () => void;
  aiActions: ReactNode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AppHeader = ({
  data,
  activeTitle,
  onDownloadError,
  aiActions,
  isSidebarOpen,
  onToggleSidebar,
}: AppHeaderProps) => {
  const { t } = useTranslation();
  const sidebarLabel = isSidebarOpen ? t('sidebar.closeSidebar') : t('sidebar.openSidebar');

  return (
    <header className="sticky top-0 z-10 bg-white shadow">
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 md:flex md:h-16 md:gap-3 md:px-4 lg:px-8">
        <Button
          type="text"
          size="large"
          onClick={onToggleSidebar}
          aria-label={sidebarLabel}
          aria-expanded={isSidebarOpen}
          title={sidebarLabel}
          icon={isSidebarOpen ? <PanelLeftClose size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          className="justify-self-start md:-ml-2"
        />

        <h1 className="min-w-0 truncate text-lg font-bold text-gray-800 md:text-xl">
          <span className="md:hidden">{t('header.shortTitle')}</span>
          <span className="hidden md:inline">{t('header.title')}</span>
        </h1>

        <div className="justify-self-end md:ml-auto">
          <LanguageSelector />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {aiActions}
          <DownloadPdfButton data={data} activeTitle={activeTitle} onError={onDownloadError} size="large" />
        </div>
      </div>
    </header>
  );
};
