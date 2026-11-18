import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Collapse, Form, Input, Table, Tag, type CollapseProps, type TableColumnsType } from 'antd';
import type { CVData } from '@/types/cv';
import type { KeywordCoverage } from './keywords';
import type { TailorResult } from './parse';

interface TailorResultViewProps {
  base: CVData;
  result: TailorResult;
  coverageBefore: KeywordCoverage[];
  coverageAfter: KeywordCoverage[];
  newTerms: string[];
  title: string;
  onTitleChange: (title: string) => void;
}

interface Comparison {
  key: string;
  label: string;
  before: string;
  after: string;
}

/** Side-by-side text of one section; open by default when it changed. */
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

const projectsText = (cv: CVData) =>
  (cv.projects ?? []).map((p) => `${p.name}: ${p.description}`).join('\n\n');

export const TailorResultView = ({
  base,
  result,
  coverageBefore,
  coverageAfter,
  newTerms,
  title,
  onTitleChange,
}: TailorResultViewProps) => {
  const { t } = useTranslation();
  const titleId = useId();
  const { cv, missingKeywords, changes, discardedItems } = result;
  const total = coverageAfter.length;
  const coveredBefore = coverageBefore.filter((k) => k.count > 0).length;
  const coveredAfter = coverageAfter.filter((k) => k.count > 0).length;

  const comparisons: Comparison[] = [
    { key: 'headline', label: t('ai.tailor.section_headline'), before: base.jobTitle, after: cv.jobTitle },
    { key: 'summary', label: t('ai.tailor.section_summary'), before: base.objective, after: cv.objective },
    { key: 'skills', label: t('ai.tailor.section_skills'), before: base.skills, after: cv.skills },
    { key: 'softSkills', label: t('ai.tailor.softSkills'), before: base.softSkills ?? '', after: cv.softSkills ?? '' },
    ...base.experience.map((original, index) => ({
      key: `experience-${original.id}`,
      label: `${t('ai.tailor.section_experience')}: ${original.role} — ${original.company}`,
      before: original.description,
      after: cv.experience[index].description,
    })),
    { key: 'projects', label: t('ai.tailor.section_projects'), before: projectsText(base), after: projectsText(cv) },
  ];
  const isChanged = (item: Comparison) => item.before.trim() !== item.after.trim();

  const compareItems: CollapseProps['items'] = comparisons.map((item) => ({
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

  const columns: TableColumnsType<KeywordCoverage & { before: number }> = [
    {
      title: t('ai.tailor.colKeyword'),
      dataIndex: 'term',
      render: (term: string, keyword) => (
        <span className="font-medium text-gray-800">
          <span aria-hidden>{keyword.count > 0 ? '✓ ' : '✗ '}</span>
          {term}
          <span className="sr-only">, {t(`ai.tailor.priority_${keyword.priority}`)}</span>
        </span>
      ),
    },
    { title: t('ai.tailor.colBefore'), dataIndex: 'before', align: 'right', className: 'tabular-nums text-gray-500' },
    {
      title: t('ai.tailor.colAfter'),
      dataIndex: 'count',
      align: 'right',
      render: (count: number) => (
        <span className={`tabular-nums ${count > 0 ? 'text-emerald-700' : 'text-red-700'}`}>{count}</span>
      ),
    },
    {
      title: t('ai.tailor.colWhere'),
      dataIndex: 'sections',
      render: (sections: string[]) => sections.map((section) => t(`ai.tailor.section_${section}`)).join(', ') || '—',
    },
  ];

  return (
    <div className="space-y-5">
      <Form layout="vertical" component={false}>
        <Form.Item label={t('ai.tailor.newTitle')} htmlFor={titleId}>
          <Input id={titleId} value={title} onChange={(e) => onTitleChange(e.target.value)} />
        </Form.Item>
      </Form>

      <Alert
        type="info"
        showIcon
        role="status"
        title={t('ai.tailor.coverageSummary', { before: coveredBefore, after: coveredAfter, total })}
      />

      {newTerms.length > 0 && (
        <Alert
          type="warning"
          showIcon
          role="note"
          title={
            <>
              {t('ai.tailor.newTermsWarning')} <strong>{newTerms.join(', ')}</strong>
            </>
          }
        />
      )}

      {discardedItems > 0 && (
        <Alert type="info" role="note" title={t('ai.tailor.discardedWarning', { count: discardedItems })} />
      )}

      {changes.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold text-gray-800">{t('ai.tailor.changesTitle')}</h3>
          <ul className="list-disc space-y-1 pl-5">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      )}

      {missingKeywords.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold text-gray-800">{t('ai.tailor.missingTitle')}</h3>
          <p className="mb-2 text-gray-600">{t('ai.tailor.missingHelp')}</p>
          <div className="flex flex-wrap gap-y-2">
            {missingKeywords.map((keyword) => (
              <Tag key={keyword}>{keyword}</Tag>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-semibold text-gray-800">{t('ai.tailor.coverageTitle')}</h3>
        <Table
          size="small"
          rowKey="term"
          pagination={false}
          scroll={{ x: true }}
          columns={columns}
          dataSource={coverageAfter.map((keyword, index) => ({ ...keyword, before: coverageBefore[index]?.count ?? 0 }))}
        />
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800">{t('ai.tailor.compareTitle')}</h3>
        <Collapse items={compareItems} defaultActiveKey={comparisons.filter(isChanged).map((item) => item.key)} />
      </section>
    </div>
  );
};
