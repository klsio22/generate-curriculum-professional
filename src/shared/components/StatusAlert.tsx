import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Collapse, Spin } from 'antd';

export type StatusTone = 'success' | 'error' | 'info' | 'busy';

interface StatusAlertProps {
  tone: StatusTone;
  children: ReactNode;
  detail?: string;
  className?: string;
}

const TYPE = { success: 'success', error: 'error', info: 'info', busy: 'info' } as const;

export const StatusAlert = ({ tone, children, detail, className }: StatusAlertProps) => {
  const { t } = useTranslation();
  return (
    <Alert
      type={TYPE[tone]}
      showIcon
      role="presentation"
      className={className}
      icon={tone === 'busy' ? <Spin size="small" /> : undefined}
      title={
        <div>
          <div>{children}</div>
          {detail && (
            <Collapse
              ghost
              size="small"
              className="-ml-4 text-xs"
              items={[
                {
                  key: 'detail',
                  label: t('status.technicalDetails'),
                  children: <p className="break-words font-mono text-xs">{detail}</p>,
                },
              ]}
            />
          )}
        </div>
      }
    />
  );
};
