import type { ReactNode } from 'react';
import { Typography } from 'antd';

export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <Typography.Title level={4} className="m-0">
      {title}
    </Typography.Title>
    {children}
  </section>
);
