import * as React from 'react';
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type Path,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { CVData } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface CVFormProps {
  defaultValues: CVData;
  onSubmit: (data: CVData) => void;
  register: UseFormRegister<CVData>;
  control: Control<CVData>;
  onSave?: () => void;
}

const SectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-3 border-b pb-1">
    {title}
  </h3>
);

export const CVForm: React.FC<CVFormProps> = ({
  register,
  control,
  onSave,
}) => {
  const { t } = useTranslation();
  const callSave = () => {
    if (onSave) onSave();
  };

  const reg = (name: Path<CVData>) => ({ ...register(name), onBlur: callSave });
  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({
    control,
    name: 'education',
  });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({
    control,
    name: 'experience',
  });

  const {
    fields: refFields,
    append: appendRef,
    remove: removeRef,
  } = useFieldArray({
    control,
    name: 'references',
  });

  

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: 'projects',
  });

  return (
    <div className="bg-white p-6 shadow rounded-lg space-y-4">
      <SectionHeader title={t('form.personalData')} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            {t('form.fullName')}
          </label>
          <input
            id="fullName"
            {...reg('fullName')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
            {t('form.jobTitle')}
          </label>
          <input
            id="jobTitle"
            {...reg('jobTitle')}
            placeholder={t('form.jobTitlePlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('form.email')}
          </label>
          <input
            id="email"
            {...reg('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t('form.phone')}
          </label>
          <input
            id="phone"
            {...reg('phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            {t('form.address')}
          </label>
          <input
            id="address"
            {...reg('address')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
            {t('form.linkedin')}
          </label>
          <input
            id="linkedin"
            {...reg('linkedin')}
            placeholder={t('form.linkedinPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          <label htmlFor="linkedinName" className="block text-xs font-medium text-gray-600 mt-2">{t('form.linkedinName')}</label>
          <input
            id="linkedinName"
            {...reg('linkedinName')}
            placeholder={t('form.linkedinNamePlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="github" className="block text-sm font-medium text-gray-700">
            {t('form.github')}
          </label>
          <input
            id="github"
            {...reg('github')}
            placeholder={t('form.githubPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          <label htmlFor="githubName" className="block text-xs font-medium text-gray-600 mt-2">{t('form.githubName')}</label>
          <input
            id="githubName"
            {...reg('githubName')}
            placeholder={t('form.githubNamePlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
          />
        </div>
        <div>
          <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700">
            {t('form.portfolio')}
          </label>
          <input
            id="portfolio"
            {...reg('portfolio')}
            placeholder={t('form.portfolioPlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          <label htmlFor="portfolioName" className="block text-xs font-medium text-gray-600 mt-2">{t('form.portfolioName')}</label>
          <input
            id="portfolioName"
            {...reg('portfolioName')}
            placeholder={t('form.portfolioNamePlaceholder')}
            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm sm:text-sm border p-2"
          />
        </div>
      </div>

      <SectionHeader title={t('form.objective')} />
      <div>
        <label htmlFor="objective" className="sr-only">{t('form.objective')}</label>
        <textarea
          id="objective"
          {...reg('objective')}
          rows={6}
          className="mt-1 block w-full h-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          placeholder={t('form.objectivePlaceholder')}
        />
      </div>

      <SectionHeader title={t('form.experience')} />
      {expFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-gray-50 p-4 rounded-md mb-3 border relative"
        >
          <button
            type="button"
            onClick={() => {
              removeExp(index);
              // let react-hook-form update internal state, then trigger save
              setTimeout(() => callSave(), 0);
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`experience-${index}-company`} className="block text-sm font-medium text-gray-700">{t('form.company')}</label>
              <input
                id={`experience-${index}-company`}
                {...reg((`experience.${index}.company`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`experience-${index}-role`} className="block text-sm font-medium text-gray-700">{t('form.role')}</label>
              <input
                id={`experience-${index}-role`}
                {...reg((`experience.${index}.role`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`experience-${index}-startDate`} className="block text-sm font-medium text-gray-700">{t('form.startDate')}</label>
              <input
                id={`experience-${index}-startDate`}
                {...reg((`experience.${index}.startDate`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`experience-${index}-endDate`} className="block text-sm font-medium text-gray-700">{t('form.endDate')}</label>
              <input
                id={`experience-${index}-endDate`}
                {...reg((`experience.${index}.endDate`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`experience-${index}-description`} className="block text-sm font-medium text-gray-700">{t('form.descriptionActivities')}</label>
              <textarea
                id={`experience-${index}-description`}
                {...reg((`experience.${index}.description`) as Path<CVData>)}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          appendExp({
            id: '',
            role: '',
            company: '',
            startDate: '',
            endDate: '',
            description: '',
          });
          setTimeout(() => callSave(), 0);
        }}
        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Plus size={18} className="mr-1" /> {t('form.addExperience')}
      </button>

      <SectionHeader title={t('form.education')} />
      {eduFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-gray-50 p-4 rounded-md mb-3 border relative"
        >
          <button
            type="button"
            onClick={() => {
              removeEdu(index);
              setTimeout(() => callSave(), 0);
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`education-${index}-course`} className="block text-sm font-medium text-gray-700">{t('form.course')}</label>
              <input
                id={`education-${index}-course`}
                {...reg((`education.${index}.course`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`education-${index}-institution`} className="block text-sm font-medium text-gray-700">{t('form.institution')}</label>
              <input
                id={`education-${index}-institution`}
                {...reg((`education.${index}.institution`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`education-${index}-startDate`} className="block text-sm font-medium text-gray-700">{t('form.startDate')}</label>
              <input
                id={`education-${index}-startDate`}
                {...reg((`education.${index}.startDate`) as Path<CVData>)}
                placeholder={t('form.startDatePlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`education-${index}-endDate`} className="block text-sm font-medium text-gray-700">{t('form.endDate')}</label>
              <input
                id={`education-${index}-endDate`}
                {...reg((`education.${index}.endDate`) as Path<CVData>)}
                placeholder={t('form.endDatePlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`education-${index}-topics`} className="block text-sm font-medium text-gray-700">{t('form.topics')}</label>
              <textarea
                id={`education-${index}-topics`}
                {...reg((`education.${index}.topics`) as Path<CVData>)}
                placeholder={t('form.topicsPlaceholder')}
                rows={6}
                className="mt-1 block w-full h-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          appendEdu({
            id: '',
            course: '',
            institution: '',
            startDate: '',
            endDate: '',
            topics: '',
          });
          setTimeout(() => callSave(), 0);
        }}
        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Plus size={18} className="mr-1" /> {t('form.addEducation')}
      </button>



      <SectionHeader title={t('form.projects')} />
      {projectFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-gray-50 p-4 rounded-md mb-3 border relative"
        >
          <button
            type="button"
            onClick={() => {
              removeProject(index);
              setTimeout(() => callSave(), 0);
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`projects-${index}-name`} className="block text-sm font-medium text-gray-700">{t('form.projectName')}</label>
              <input
                id={`projects-${index}-name`}
                {...reg((`projects.${index}.name`) as Path<CVData>)}
                placeholder={t('form.projectNamePlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`projects-${index}-technologies`} className="block text-sm font-medium text-gray-700">{t('form.technologies')}</label>
              <input
                id={`projects-${index}-technologies`}
                {...reg((`projects.${index}.technologies`) as Path<CVData>)}
                placeholder={t('form.technologiesPlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`projects-${index}-startDate`} className="block text-sm font-medium text-gray-700">{t('form.projectStartDate')}</label>
              <input
                id={`projects-${index}-startDate`}
                {...reg((`projects.${index}.startDate`) as Path<CVData>)}
                placeholder={t('form.projectStartDatePlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`projects-${index}-endDate`} className="block text-sm font-medium text-gray-700">{t('form.projectEndDate')}</label>
              <input
                id={`projects-${index}-endDate`}
                {...reg((`projects.${index}.endDate`) as Path<CVData>)}
                placeholder={t('form.projectEndDatePlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`projects-${index}-link`} className="block text-sm font-medium text-gray-700">{t('form.projectLink')}</label>
              <input
                id={`projects-${index}-link`}
                {...reg((`projects.${index}.link`) as Path<CVData>)}
                placeholder={t('form.projectLinkPlaceholder')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor={`projects-${index}-description`} className="block text-sm font-medium text-gray-700">{t('form.projectDescription')}</label>
              <textarea
                id={`projects-${index}-description`}
                {...reg((`projects.${index}.description`) as Path<CVData>)}
                placeholder={t('form.projectDescriptionPlaceholder')}
                rows={8}
                className="mt-1 block w-full h-52 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          appendProject({
            id: '',
            name: '',
            description: '',
            technologies: '',
            link: '',
            startDate: '',
            endDate: '',
          });
          setTimeout(() => callSave(), 0);
        }}
        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Plus size={18} className="mr-1" /> {t('form.addProject')}
      </button>

      

      <SectionHeader title={t('form.skills')} />
      <div>
        <label htmlFor="skills" className="sr-only">{t('form.skills')}</label>
        <textarea
          id="skills"
          {...reg('skills')}
          rows={8}
          className="mt-1 block w-full h-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          placeholder={t('form.skillsPlaceholder')}
        />
      </div>

      <SectionHeader title={t('form.languages')} />
      <div>
        <label htmlFor="languages" className="sr-only">{t('form.languages')}</label>
        <textarea
          id="languages"
          {...reg('languages')}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          placeholder={t('form.languagesPlaceholder')}
        />
      </div>

      <SectionHeader title={t('form.softSkills')} />
      <div>
        <label htmlFor="softSkills" className="sr-only">{t('form.softSkills')}</label>
        <textarea
          id="softSkills"
          {...reg('softSkills')}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          placeholder={t('form.softSkillsPlaceholder')}
        />
      </div>

      <SectionHeader title={t('form.interpersonalSkills')} />
      <div>
        <label htmlFor="interpersonalSkills" className="sr-only">{t('form.interpersonalSkills')}</label>
        <textarea
          id="interpersonalSkills"
          {...reg('interpersonalSkills')}
          rows={10}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          placeholder={t('form.interpersonalSkillsPlaceholder')}
        />
      </div>

      

      <SectionHeader title={t('form.references')} />
      {refFields.map((field, index) => (
        <div
          key={field.id}
          className="bg-gray-50 p-4 rounded-md mb-3 border relative"
        >
          <button
            type="button"
            onClick={() => {
              removeRef(index);
              setTimeout(() => callSave(), 0);
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <Trash2 size={18} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`references-${index}-name`} className="block text-sm font-medium text-gray-700">{t('form.name')}</label>
              <input
                id={`references-${index}-name`}
                {...reg((`references.${index}.name`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`references-${index}-email`} className="block text-sm font-medium text-gray-700">{t('form.email')}</label>
              <input
                id={`references-${index}-email`}
                {...reg((`references.${index}.email`) as Path<CVData>)}
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label htmlFor={`references-${index}-phone`} className="block text-sm font-medium text-gray-700">{t('form.phone')}</label>
              <input
                id={`references-${index}-phone`}
                {...reg((`references.${index}.phone`) as Path<CVData>)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          appendRef({
            id: '',
            name: '',
            email: '',
            phone: '',
          });
          setTimeout(() => callSave(), 0);
        }}
        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Plus size={18} className="mr-1" /> {t('form.addReference')}
      </button>
    </div>
  );
};
