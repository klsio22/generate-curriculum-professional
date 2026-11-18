import type { ComponentType, ReactNode } from 'react';
import { useFieldArray, type Control, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Card, Form } from 'antd';
import { Globe } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/shared/components/BrandIcons';
import type { CVData } from '@/types/cv';
import { FormField } from './components/FormField';
import { FormSection } from './components/FormSection';
import { RepeatableList } from './components/RepeatableList';

interface CVFormProps {
  control: Control<CVData>;
  onSave: () => void;
}

interface FieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  rows?: number;
  type?: 'email';
  wide?: boolean;
}

interface PersonalFieldSpec extends FieldSpec {
  key: Path<CVData>;
}

interface LinkFieldSpec extends PersonalFieldSpec {
  icon: ComponentType<{ size?: number; className?: string }>;
  display: { key: Path<CVData>; label: string; placeholder: string };
}

const PERSONAL: PersonalFieldSpec[] = [
  { key: 'fullName', label: 'form.fullName' },
  { key: 'jobTitle', label: 'form.jobTitle', placeholder: 'form.jobTitlePlaceholder' },
  { key: 'email', label: 'form.email', type: 'email' },
  { key: 'phone', label: 'form.phone' },
  { key: 'address', label: 'form.address', wide: true },
];

const LINKS: LinkFieldSpec[] = [
  {
    key: 'linkedin',
    label: 'form.linkedin',
    placeholder: 'form.linkedinPlaceholder',
    icon: LinkedinIcon,
    display: { key: 'linkedinName', label: 'form.linkedinName', placeholder: 'form.linkedinNamePlaceholder' },
  },
  {
    key: 'github',
    label: 'form.github',
    placeholder: 'form.githubPlaceholder',
    icon: GithubIcon,
    display: { key: 'githubName', label: 'form.githubName', placeholder: 'form.githubNamePlaceholder' },
  },
  {
    key: 'portfolio',
    label: 'form.portfolio',
    placeholder: 'form.portfolioPlaceholder',
    icon: Globe,
    display: { key: 'portfolioName', label: 'form.portfolioName', placeholder: 'form.portfolioNamePlaceholder' },
  },
];

const LINK_ROW = 'grid grid-cols-[1.6fr_1fr] items-end gap-3';

const EXPERIENCE: FieldSpec[] = [
  { key: 'company', label: 'form.company' },
  { key: 'role', label: 'form.role' },
  { key: 'startDate', label: 'form.startDate' },
  { key: 'endDate', label: 'form.endDate' },
  { key: 'description', label: 'form.descriptionActivities', rows: 6, wide: true },
];

const EDUCATION: FieldSpec[] = [
  { key: 'course', label: 'form.course' },
  { key: 'institution', label: 'form.institution' },
  { key: 'startDate', label: 'form.startDate', placeholder: 'form.startDatePlaceholder' },
  { key: 'endDate', label: 'form.endDate', placeholder: 'form.endDatePlaceholder' },
  { key: 'topics', label: 'form.topics', placeholder: 'form.topicsPlaceholder', rows: 6, wide: true },
];

const PROJECTS: FieldSpec[] = [
  { key: 'name', label: 'form.projectName', placeholder: 'form.projectNamePlaceholder' },
  { key: 'technologies', label: 'form.technologies', placeholder: 'form.technologiesPlaceholder' },
  { key: 'startDate', label: 'form.projectStartDate', placeholder: 'form.projectStartDatePlaceholder' },
  { key: 'endDate', label: 'form.projectEndDate', placeholder: 'form.projectEndDatePlaceholder' },
  { key: 'link', label: 'form.projectLink', placeholder: 'form.projectLinkPlaceholder', wide: true },
  { key: 'description', label: 'form.projectDescription', placeholder: 'form.projectDescriptionPlaceholder', rows: 8, wide: true },
];

const REFERENCES: FieldSpec[] = [
  { key: 'name', label: 'form.name' },
  { key: 'email', label: 'form.email', type: 'email' },
  { key: 'phone', label: 'form.phone' },
];

const TEXT_SECTIONS: { key: Path<CVData>; label: string; placeholder: string; rows: number }[] = [
  { key: 'skills', label: 'form.skills', placeholder: 'form.skillsPlaceholder', rows: 8 },
  { key: 'languages', label: 'form.languages', placeholder: 'form.languagesPlaceholder', rows: 6 },
  { key: 'softSkills', label: 'form.softSkills', placeholder: 'form.softSkillsPlaceholder', rows: 6 },
  { key: 'interpersonalSkills', label: 'form.interpersonalSkills', placeholder: 'form.interpersonalSkillsPlaceholder', rows: 10 },
];

const EMPTY = {
  experience: { id: '', role: '', company: '', startDate: '', endDate: '', description: '' },
  education: { id: '', course: '', institution: '', startDate: '', endDate: '', topics: '' },
  projects: { id: '', name: '', description: '', technologies: '', link: '', startDate: '', endDate: '' },
  references: { id: '', name: '', email: '', phone: '' },
};

export const CVForm = ({ control, onSave }: CVFormProps) => {
  const { t } = useTranslation();
  const experience = useFieldArray({ control, name: 'experience' });
  const education = useFieldArray({ control, name: 'education' });
  const projects = useFieldArray({ control, name: 'projects' });
  const references = useFieldArray({ control, name: 'references' });

  const saveSoon = () => setTimeout(onSave, 0);

  const field = (name: Path<CVData>, spec: Omit<FieldSpec, 'key'>, extra: { hideLabel?: boolean; prefix?: ReactNode } = {}) => (
    <FormField
      control={control}
      name={name}
      label={t(spec.label)}
      placeholder={spec.placeholder ? t(spec.placeholder) : undefined}
      rows={spec.rows}
      type={spec.type}
      onSave={onSave}
      {...extra}
    />
  );

  const itemGrid = (section: string, index: number, specs: FieldSpec[], columns = 'md:grid-cols-2') => (
    <div className={`grid grid-cols-1 gap-4 ${columns}`}>
      {specs.map((spec) => (
        <div key={spec.key} className={spec.wide ? 'md:col-span-2' : undefined}>
          {field(`${section}.${index}.${spec.key}` as Path<CVData>, spec)}
        </div>
      ))}
    </div>
  );

  return (
    <Card className="shadow-sm">
      <Form layout="vertical" component={false}>
        <div className="[&>section+section]:mt-6 [&>section+section]:border-t [&>section+section]:border-zinc-100 [&>section+section]:pt-6">
          <FormSection title={t('form.personalData')}>
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
              {PERSONAL.map((spec) => (
                <div key={spec.key} className={spec.wide ? 'md:col-span-2' : undefined}>
                  {field(spec.key, spec)}
                </div>
              ))}
            </div>
            <div className="mt-1 space-y-2">
              <div className={`${LINK_ROW} text-sm text-gray-700`} aria-hidden>
                <span>{t('form.linkUrl')}</span>
                <span>{t('form.linkDisplayName')}</span>
              </div>
              {LINKS.map(({ icon: Icon, ...spec }) => (
                <div key={spec.key} className={LINK_ROW}>
                  {field(spec.key, spec, { hideLabel: true, prefix: <Icon size={16} className="text-gray-400" aria-hidden /> })}
                  {field(spec.display.key, spec.display, { hideLabel: true })}
                </div>
              ))}
            </div>
          </FormSection>

          <FormSection title={t('form.objective')}>
            {field('objective', { label: 'form.objective', placeholder: 'form.objectivePlaceholder', rows: 6 }, { hideLabel: true })}
          </FormSection>

          <FormSection title={t('form.experience')}>
            <RepeatableList
              items={experience.fields}
              itemName={t('form.itemExperience')}
              addLabel={t('form.addExperience')}
              onAdd={() => {
                experience.append(EMPTY.experience);
                saveSoon();
              }}
              onRemove={(index) => {
                experience.remove(index);
                saveSoon();
              }}
              renderItem={(index) => itemGrid('experience', index, EXPERIENCE)}
            />
          </FormSection>

          <FormSection title={t('form.education')}>
            <RepeatableList
              items={education.fields}
              itemName={t('form.itemEducation')}
              addLabel={t('form.addEducation')}
              onAdd={() => {
                education.append(EMPTY.education);
                saveSoon();
              }}
              onRemove={(index) => {
                education.remove(index);
                saveSoon();
              }}
              renderItem={(index) => itemGrid('education', index, EDUCATION)}
            />
          </FormSection>

          <FormSection title={t('form.projects')}>
            <RepeatableList
              items={projects.fields}
              itemName={t('form.itemProject')}
              addLabel={t('form.addProject')}
              onAdd={() => {
                projects.append(EMPTY.projects);
                saveSoon();
              }}
              onRemove={(index) => {
                projects.remove(index);
                saveSoon();
              }}
              renderItem={(index) => itemGrid('projects', index, PROJECTS)}
            />
          </FormSection>

          {TEXT_SECTIONS.map((section) => (
            <FormSection key={section.key} title={t(section.label)}>
              {field(section.key, section, { hideLabel: true })}
            </FormSection>
          ))}

          <FormSection title={t('form.references')}>
            <RepeatableList
              items={references.fields}
              itemName={t('form.itemReference')}
              addLabel={t('form.addReference')}
              onAdd={() => {
                references.append(EMPTY.references);
                saveSoon();
              }}
              onRemove={(index) => {
                references.remove(index);
                saveSoon();
              }}
              renderItem={(index) => itemGrid('references', index, REFERENCES, 'md:grid-cols-3')}
            />
          </FormSection>
        </div>
      </Form>
    </Card>
  );
};
