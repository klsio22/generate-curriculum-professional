import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Collapse, Descriptions, Form, Input, Modal, Spin, type DescriptionsProps } from 'antd';
import type { CVData } from '@/types/cv';
import type { ImportedResume } from './parseResume';

export interface PdfImportState {
  fileName: string;
  result: ImportedResume | null;
}

interface ImportPdfModalProps {
  state: PdfImportState | null;
  onCreate: (cv: CVData, title: string) => void;
  onCancel: () => void;
}

const TEXT_FIELDS = ['fullName', 'jobTitle', 'email', 'phone', 'address', 'linkedin', 'github', 'portfolio', 'objective'] as const;
const LIST_FIELDS = ['experience', 'education', 'projects', 'references'] as const;
const LINE_FIELDS = ['skills', 'languages', 'softSkills', 'interpersonalSkills'] as const;

const lineCount = (text?: string) => (text ?? '').split('\n').filter((line) => line.trim()).length;

const fileTitle = (fileName: string) => fileName.replace(/\.pdf$/i, '').trim();

const ImportReview = ({ fileName, result, onCreate, onCancel }: PdfImportState & { result: ImportedResume } & Omit<ImportPdfModalProps, 'state'>) => {
  const { t } = useTranslation();
  const titleId = useId();
  const { cv, unmatched } = result;
  const [title, setTitle] = useState(cv.fullName || fileTitle(fileName));

  const missing = <span className="text-gray-400">{t('pdfImport.notFound')}</span>;
  const textValue = (field: (typeof TEXT_FIELDS)[number]) => {
    if (!cv[field]) return missing;
    if (field === 'objective') return t('pdfImport.filled');
    return <span className="break-all">{cv[field]}</span>;
  };
  const items: DescriptionsProps['items'] = [
    ...TEXT_FIELDS.map((field) => ({
      key: field,
      label: t(`pdfImport.fields.${field}`),
      children: textValue(field),
    })),
    ...LIST_FIELDS.map((field) => {
      const count = cv[field]?.length ?? 0;
      return { key: field, label: t(`pdfImport.fields.${field}`), children: count ? t('pdfImport.items', { count }) : missing };
    }),
    ...LINE_FIELDS.map((field) => {
      const count = lineCount(cv[field]);
      return { key: field, label: t(`pdfImport.fields.${field}`), children: count ? t('pdfImport.items', { count }) : missing };
    }),
  ];

  const sectionsFound = [cv.objective, cv.experience.length, cv.education.length, cv.skills].filter(Boolean).length;
  const fewFound = !cv.fullName || sectionsFound < 2;

  const footer = [
    <Button key="cancel" onClick={onCancel}>
      {t('modal.cancel')}
    </Button>,
    <Button key="create" type="primary" disabled={!title.trim()} onClick={() => onCreate(cv, title.trim())}>
      {t('pdfImport.create')}
    </Button>,
  ];

  return (
    <Modal open title={t('pdfImport.title')} onCancel={onCancel} footer={footer} width={720} destroyOnHidden>
      <div className="space-y-4">
        <p>{t('pdfImport.intro', { file: fileName })}</p>

        {fewFound ? <Alert type="warning" showIcon title={t('pdfImport.fewFound')} /> : <Alert type="info" showIcon title={t('pdfImport.review')} />}

        <div>
          <Form layout="vertical" component={false}>
            <Form.Item label={t('pdfImport.resumeName')} htmlFor={titleId} className="mb-0">
              <Input id={titleId} value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
            </Form.Item>
          </Form>
        </div>

        <Descriptions title={t('pdfImport.found')} items={items} column={{ xs: 1, sm: 2 }} size="small" bordered />

        {unmatched.length > 0 && (
          <Collapse
            size="small"
            items={[
              {
                key: 'unmatched',
                label: t('pdfImport.unmatched', { count: unmatched.length }),
                children: <p className="whitespace-pre-line text-sm text-gray-700">{unmatched.join('\n')}</p>,
              },
            ]}
          />
        )}
      </div>
    </Modal>
  );
};

export const ImportPdfModal = ({ state, onCreate, onCancel }: ImportPdfModalProps) => {
  const { t } = useTranslation();
  if (!state) return null;

  if (!state.result) {
    return (
      <Modal open title={t('pdfImport.title')} onCancel={onCancel} footer={null} destroyOnHidden>
        <output className="flex items-center gap-3 py-6">
          <Spin />
          <span>{t('pdfImport.reading')}</span>
        </output>
      </Modal>
    );
  }

  return <ImportReview fileName={state.fileName} result={state.result} onCreate={onCreate} onCancel={onCancel} />;
};
