import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from 'antd';
import { Plus, Trash2 } from 'lucide-react';

interface RepeatableListProps {
  /** Items from react-hook-form's useFieldArray (only the stable `id` is used). */
  items: { id: string }[];
  /** Name of one item, numbered in each card: "Experience 1". */
  itemName: string;
  addLabel: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (index: number) => ReactNode;
}

/** Cards for experience, education, projects and references, with add and remove buttons. */
export const RepeatableList = ({ items, itemName, addLabel, onAdd, onRemove, renderItem }: RepeatableListProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const title = `${itemName} ${index + 1}`;
        return (
          <Card
            key={item.id}
            size="small"
            title={title}
            className="bg-gray-50"
            extra={
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} aria-hidden />}
                aria-label={t('form.removeItem', { item: title })}
                title={t('form.removeItem', { item: title })}
                onClick={() => onRemove(index)}
              />
            }
          >
            {renderItem(index)}
          </Card>
        );
      })}
      <Button type="dashed" block icon={<Plus size={16} aria-hidden />} onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
};
