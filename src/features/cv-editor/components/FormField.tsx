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
  secondary?: boolean;
  onSave: () => void;
}

const fieldId = (name: string) => name.replaceAll('.', '-');

export const FormField = ({ control, name, label, placeholder, rows, type = 'text', hideLabel, secondary, onSave }: FormFieldProps) => {
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
          <Input {...common} type={type} />
        );
        return (
          <Form.Item
            label={hideLabel ? undefined : label}
            htmlFor={id}
            className={secondary ? 'mb-0 [&_label]:text-xs [&_label]:text-gray-500' : 'mb-0'}
          >
            {input}
          </Form.Item>
        );
      }}
    />
  );
};
