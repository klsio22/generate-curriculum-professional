import type { ReactNode } from 'react';
import { Controller, type Control, type Path } from 'react-hook-form';
import { Form, Input } from 'antd';
import type { CVData } from '@/types/cv';

export interface FormFieldProps {
  control: Control<CVData>;
  name: Path<CVData>;
  label: string;
  placeholder?: string;
  rows?: number;
  type?: 'text' | 'email';
  hideLabel?: boolean;
  prefix?: ReactNode;
  onSave: () => void;
}

const fieldId = (name: string) => name.replaceAll('.', '-');

export const FormField = ({ control, name, label, placeholder, rows, type = 'text', hideLabel, prefix, onSave }: FormFieldProps) => {
  const id = fieldId(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const common = {
          id,
          name: field.name,
          ref: field.ref,
          value: typeof field.value === 'string' ? field.value : '',
          placeholder,
          onChange: field.onChange,
          onBlur: () => {
            field.onBlur();
            onSave();
          },
          'aria-label': hideLabel ? label : undefined,
        };
        const input = rows ? (
          <Input.TextArea {...common} autoSize={{ minRows: rows }} />
        ) : (
          <Input {...common} type={type} prefix={prefix} />
        );
        return (
          <Form.Item
            label={hideLabel ? undefined : label}
            htmlFor={id}
            className="mb-0"
          >
            {input}
          </Form.Item>
        );
      }}
    />
  );
};
