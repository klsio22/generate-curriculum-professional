import { useTranslation } from 'react-i18next';
import { Collapse, type CollapseProps } from 'antd';

export interface Comparison {
  key: string;
  label: string;
  before: string;
  after: string;
}

const BeforeAfter = ({ before, after }: { before: string; after: string }) => {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">{t('ai.tailor.before')}</h4>
        <p className="whitespace-pre-line rounded bg-gray-50 p-2 text-gray-600">{before || '—'}</p>
      </div>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase text-emerald-700">{t('ai.tailor.after')}</h4>
        <p className="whitespace-pre-line rounded bg-emerald-50 p-2 text-gray-800">{after || '—'}</p>
      </div>
    </div>
  );
};

const isChanged = (item: Comparison) => item.before.trim() !== item.after.trim();

export const ResumeComparison = ({ items }: { items: Comparison[] }) => {
  const { t } = useTranslation();

  const collapseItems: CollapseProps['items'] = items.map((item) => ({
    key: item.key,
    label: (
      <span className="font-medium">
        {item.label}
        {!isChanged(item) && <span className="font-normal text-gray-500"> — {t('ai.tailor.unchanged')}</span>}
      </span>
    ),
    collapsible: isChanged(item) ? undefined : 'disabled',
    children: <BeforeAfter before={item.before} after={item.after} />,
  }));

  return <Collapse items={collapseItems} defaultActiveKey={items.filter(isChanged).map((item) => item.key)} />;
};
