import type { ReactNode } from 'react';
import type { Control, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { CVData } from '@/types/cv';
import { FormField } from './FormField';

export interface FieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  rows?: number;
  type?: 'email';
  wide?: boolean;
}

export interface FieldContext {
  control: Control<CVData>;
  onSave: () => void;
}

interface SpecFieldProps extends FieldContext {
  name: Path<CVData>;
  spec: Omit<FieldSpec, 'key'>;
  hideLabel?: boolean;
  prefix?: ReactNode;
}

export const SpecField = ({ control, onSave, name, spec, hideLabel, prefix }: SpecFieldProps) => {
  const { t } = useTranslation();
  return (
    <FormField
      control={control}
      name={name}
      label={t(spec.label)}
      placeholder={spec.placeholder ? t(spec.placeholder) : undefined}
      rows={spec.rows}
      type={spec.type}
      onSave={onSave}
      hideLabel={hideLabel}
      prefix={prefix}
    />
  );
};
