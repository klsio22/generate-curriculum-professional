import type { Path } from 'react-hook-form';
import type { CVData } from '@/types/cv';
import { SpecField, type FieldContext, type FieldSpec } from './SpecField';

interface ItemGridProps extends FieldContext {
  section: string;
  index: number;
  specs: FieldSpec[];
  columns?: string;
}

export const ItemGrid = ({ section, index, specs, columns = 'md:grid-cols-2', ...context }: ItemGridProps) => (
  <div className={`grid grid-cols-1 gap-4 ${columns}`}>
    {specs.map((spec) => (
      <div key={spec.key} className={spec.wide ? 'md:col-span-2' : undefined}>
        <SpecField {...context} name={`${section}.${index}.${spec.key}` as Path<CVData>} spec={spec} />
      </div>
    ))}
  </div>
);
