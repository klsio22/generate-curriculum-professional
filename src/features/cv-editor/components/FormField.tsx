import { Controller, type Control, type Path } from 'react-hook-form';
import { Form, Input } from 'antd';
import type { CVData } from '@/types/cv';

export interface FormFieldProps {
  control: Control<CVData>;
  name: Path<CVData>;
  label: string;
  placeholder?: string;
  /** Multi-line text; the field grows with the content from this many rows. */
  rows?: number;
  type?: 'text' | 'email';
  /** The section title already names the field: keep the label for screen readers only. */
  hideLabel?: boolean;
  /** Smaller label, for a field that complements the one above (e.g. the name shown for a link). */
  secondary?: boolean;
  /** Called when the field loses focus, to save the resume. */
  onSave: () => void;
}

const fieldId = (name: string) => name.replaceAll('.', '-');

/**
 * Label + antd input bound to react-hook-form with a Controller (antd inputs
 * do not expose the native element the way `register` expects).
 */
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
            className={secondary ? 'mb-0 mt-2 [&_label]:text-xs [&_label]:text-gray-500' : 'mb-0'}
          >
            {input}
          </Form.Item>
        );
      }}
    />
  );
};
