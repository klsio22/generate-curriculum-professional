import type { ReactNode } from 'react';
import { Typography } from 'antd';

/** Titled block of the resume form. */
export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <Typography.Title level={4} className="mb-0 mt-6 border-b border-gray-200 pb-1 first:mt-0">
      {title}
    </Typography.Title>
    {children}
  </section>
);
