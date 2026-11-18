import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import ptBR from 'antd/locale/pt_BR';

export const BRAND = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryActive: '#3730a3',
  hoverFill: '#eef2ff',
  radius: 6,
} as const;

export const AntdProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  return (
    <StyleProvider layer>
      <ConfigProvider
        locale={i18n.language === 'en' ? enUS : ptBR}
        theme={{
          token: {
            colorPrimary: BRAND.primary,
            colorPrimaryHover: BRAND.primaryHover,
            colorPrimaryActive: BRAND.primaryActive,
            colorLink: BRAND.primary,
            colorLinkHover: BRAND.primaryHover,
            borderRadius: BRAND.radius,
            fontFamily: 'inherit',
          },
          components: {
            Button: {
              fontWeight: 500,
              defaultHoverBg: BRAND.hoverFill,
              defaultHoverColor: BRAND.primaryHover,
              defaultHoverBorderColor: BRAND.primaryHover,
            },
            Segmented: {
              itemSelectedBg: BRAND.primary,
              itemSelectedColor: '#ffffff',
              itemHoverColor: BRAND.primaryHover,
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </StyleProvider>
  );
};
