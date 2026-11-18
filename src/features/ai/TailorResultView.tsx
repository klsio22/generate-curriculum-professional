import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
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

const BeforeAfter = ({ label, before, after }: { label: string; before: string; after: string }) => {
  const { t } = useTranslation();
  const changed = before.trim() !== after.trim();
  return (
    <details className="rounded-md border border-gray-200" open={changed}>
      <summary className="cursor-pointer px-3 py-2 font-medium text-gray-800">
        {label} {!changed && <span className="font-normal text-gray-500">— {t('ai.tailor.unchanged')}</span>}
      </summary>
      {changed && (
        <div className="grid gap-3 p-3 pt-0 md:grid-cols-2">
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">{t('ai.tailor.before')}</h4>
            <p className="whitespace-pre-line rounded bg-gray-50 p-2 text-gray-600">{before || '—'}</p>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase text-emerald-700">{t('ai.tailor.after')}</h4>
            <p className="whitespace-pre-line rounded bg-emerald-50 p-2 text-gray-800">{after || '—'}</p>
          </div>
        </div>
      )}
    </details>
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

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={titleId} className="mb-1 block text-sm font-medium text-gray-700">
          {t('ai.tailor.newTitle')}
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <p className="rounded-md bg-indigo-50 p-3 font-medium text-indigo-900">
        {t('ai.tailor.coverageSummary', { before: coveredBefore, after: coveredAfter, total })}
      </p>

      {newTerms.length > 0 && (
        <div role="note" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p>{t('ai.tailor.newTermsWarning')}</p>
            <p className="mt-1 font-semibold">{newTerms.join(', ')}</p>
          </div>
        </div>
      )}

      {discardedItems > 0 && (
        <p role="note" className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
          {t('ai.tailor.discardedWarning', { count: discardedItems })}
        </p>
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
          <p className="mb-1 text-gray-600">{t('ai.tailor.missingHelp')}</p>
          <p className="font-medium">{missingKeywords.join(', ')}</p>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-semibold text-gray-800">{t('ai.tailor.coverageTitle')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-gray-500">
              <tr>
                <th scope="col" className="py-2 pr-3">{t('ai.tailor.colKeyword')}</th>
                <th scope="col" className="py-2 pr-3 text-right">{t('ai.tailor.colBefore')}</th>
                <th scope="col" className="py-2 pr-3 text-right">{t('ai.tailor.colAfter')}</th>
                <th scope="col" className="py-2">{t('ai.tailor.colWhere')}</th>
              </tr>
            </thead>
            <tbody>
              {coverageAfter.map((keyword, index) => (
                <tr key={keyword.term} className="border-b border-gray-100">
                  <th scope="row" className="py-1.5 pr-3 font-medium text-gray-800">
                    <span aria-hidden>{keyword.count > 0 ? '✓ ' : '✗ '}</span>
                    {keyword.term}
                    <span className="sr-only">, {t(`ai.tailor.priority_${keyword.priority}`)}</span>
                  </th>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500">{coverageBefore[index]?.count ?? 0}</td>
                  <td className={`py-1.5 pr-3 text-right tabular-nums ${keyword.count > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {keyword.count}
                  </td>
                  <td className="py-1.5 text-gray-600">
                    {keyword.sections.map((s) => t(`ai.tailor.section_${s}`)).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-gray-800">{t('ai.tailor.compareTitle')}</h3>
        <BeforeAfter label={t('ai.tailor.section_headline')} before={base.jobTitle} after={cv.jobTitle} />
        <BeforeAfter label={t('ai.tailor.section_summary')} before={base.objective} after={cv.objective} />
        <BeforeAfter label={t('ai.tailor.section_skills')} before={base.skills} after={cv.skills} />
        <BeforeAfter label={t('ai.tailor.softSkills')} before={base.softSkills ?? ''} after={cv.softSkills ?? ''} />
        {base.experience.map((original, index) => (
          <BeforeAfter
            key={original.id}
            label={`${t('ai.tailor.section_experience')}: ${original.role} — ${original.company}`}
            before={original.description}
            after={cv.experience[index].description}
          />
        ))}
        <BeforeAfter label={t('ai.tailor.section_projects')} before={projectsText(base)} after={projectsText(cv)} />
      </section>
    </div>
  );
};
