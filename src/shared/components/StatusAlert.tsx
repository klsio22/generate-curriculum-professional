import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Collapse, Spin } from 'antd';

export type StatusTone = 'success' | 'error' | 'info' | 'busy';

interface StatusAlertProps {
  tone: StatusTone;
  children: ReactNode;
  /** Technical text (e.g. the provider's message), hidden under "Technical details". */
  detail?: string;
  className?: string;
}

const TYPE = { success: 'success', error: 'error', info: 'info', busy: 'info' } as const;

/**
 * Result of an action as an antd Alert, with an optional collapsed
 * "Technical details". Place it inside a live region (role="status" or
 * role="alert"), which announces it; the Alert itself does not repeat the role.
 */
export const StatusAlert = ({ tone, children, detail, className }: StatusAlertProps) => {
  const { t } = useTranslation();
  return (
    <Alert
      type={TYPE[tone]}
      showIcon
      role="presentation"
      className={className}
      icon={tone === 'busy' ? <Spin size="small" /> : undefined}
      // Everything in the title: with a description, antd makes the title larger.
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
