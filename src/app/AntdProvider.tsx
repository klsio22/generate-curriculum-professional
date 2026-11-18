import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProvider } from '@ant-design/cssinjs';
import { App as AntdApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import ptBR from 'antd/locale/pt_BR';

/** The app's indigo (Tailwind indigo-600) as the primary color. */
export const BRAND = {
  primary: '#4f46e5', // indigo-600
  /** Hover gets darker (not lighter, antd's default), so it stays crisp. */
  primaryHover: '#4338ca', // indigo-700
  primaryActive: '#3730a3', // indigo-800
  /** Light fill behind default and dashed buttons on hover. */
  hoverFill: '#eef2ff', // indigo-50
  radius: 6,
} as const;

/**
 * Ant Design setup for the whole app:
 * - `StyleProvider layer` puts antd styles in `@layer antd`, ordered in index.css
 *   between Tailwind's base and utilities, so utility classes still win;
 * - theme with the app's colors; locale follows the i18n language;
 * - `<App>` gives `message`, `modal` and `notification` through `App.useApp()`.
 */
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
