import {
    Page,
    Text,
    View,
    Document,
    Link,
    Svg,
    Path,
} from '@react-pdf/renderer';
import { useTranslation } from 'react-i18next';
import styles from './pdfStyles';
import type { CVData } from '@/types/cv';
import { formatDate, normalizeUrl } from './textUtils';
import { buildPdfMetadata } from './pdfMetadata';
import { GITHUB_PATH, LINKEDIN_PATH } from '@/shared/brandPaths';
import { detectResumeLocale } from '@/shared/locale';
import type { ReactNode } from 'react';

export interface PDFPreviewProps {
    data: CVData;
}

export const CVDocument = ({ data }: PDFPreviewProps) => {
    const { i18n } = useTranslation();
    const locale = detectResumeLocale(data, i18n.language);
    const t = i18n.getFixedT(locale);
    const metadata = buildPdfMetadata(data, locale, t('pdf.resume'));
    const skillsList =
        data.skills
            ?.split('\n')
            .map((s) => s.trim())
            .filter(Boolean) || [];
    const langsList = data.languages?.split('\n').filter((l) => l.trim()) || [];
    const softList = data.softSkills?.split('\n').filter((s) => s.trim()) || [];

    const renderDescription = (descriptionText?: string, elementKeyPrefix = ''): ReactNode => {
        if (!descriptionText) return null;

        const descriptionLines = descriptionText.split('\n');
        const renderedElements: ReactNode[] = [];
        let isInsideSubheading = false;

        descriptionLines.forEach((line, lineIndex) => {
            const trimmedLineText = line.trim();

            if (!trimmedLineText) {
                isInsideSubheading = false;
                return;
            }

            if (trimmedLineText.endsWith(':')) {
                renderedElements.push(
                    <Text key={`${elementKeyPrefix}-subheading-${lineIndex}`} style={styles.subHeading}>
                        {trimmedLineText}
                    </Text>
                );
                isInsideSubheading = true;
            } else if (isInsideSubheading) {
                renderedElements.push(
                    <Text key={`${elementKeyPrefix}-subitem-${lineIndex}`} style={styles.bulletItem}>
                        {trimmedLineText}
                    </Text>
                );
            } else {
                renderedElements.push(
                    <Text key={`${elementKeyPrefix}-paragraph-${lineIndex}`} style={styles.bulletItem}>
                        {trimmedLineText}
                    </Text>
                );
            }
        });

        return renderedElements;
    };

    return (
        <Document {...metadata}>
            <Page size="A4" style={styles.page}>
                <View style={styles.mainContent}>
                    <View style={styles.header}>
                        <Text style={styles.fullName}>{data.fullName}</Text>
                        {data.jobTitle && (
                            <Text style={styles.jobTitle}>{data.jobTitle}</Text>
                        )}
                        <View style={styles.headerInfo}>
                            {data.email && <Text>{data.email}</Text>}
                            {data.phone && <Text>{data.phone}</Text>}
                            {data.address && <Text>{data.address}</Text>}
                            {(data.linkedin || data.github || data.portfolio) && (
                                <View style={styles.linksContainer}>

                                    {data.linkedin && (
                                        <View style={styles.socialItem}>
                                            <Svg width={18} height={18} style={{ marginRight: 6 }} viewBox={LINKEDIN_PATH.viewBox}>
                                                <Path
                                                    d={LINKEDIN_PATH.d}
                                                    fill="#000"
                                                />
                                            </Svg>
                                            <Link src={normalizeUrl(data.linkedin)} style={styles.linkText}>
                                                {data.linkedinName?.trim() ? `${data.linkedinName}` : `${data.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`}
                                            </Link>
                                        </View>
                                    )}

                                    {data.github && (
                                        <View style={styles.socialItem}>
                                            <Svg width={18} height={18} style={{ marginRight: 6 }} viewBox={GITHUB_PATH.viewBox}>
                                                <Path
                                                    d={GITHUB_PATH.d}
                                                    fill="#000"
                                                />
                                            </Svg>
                                            <Link src={normalizeUrl(data.github)} style={styles.linkText}>
                                                {data.githubName?.trim() ? `${data.githubName}` : `${data.github.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`}
                                            </Link>
                                        </View>
                                    )}

                                    {data.portfolio && (
                                        <View style={styles.socialItem}>
                                            <Link src={normalizeUrl(data.portfolio)} style={styles.linkText}>
                                                {data.portfolioName?.trim() ? `${data.portfolioName}` : `${data.portfolio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`}
                                            </Link>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>

                    {data.objective && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.profile')}</Text>
                            <Text style={styles.objective}>{data.objective}</Text>
                        </View>
                    )}

                    {data.experience && data.experience.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.experience')}</Text>
                            {data.experience.map((exp) => (
                                <View
                                    key={`${exp.company}-${exp.role}`}
                                    style={styles.itemContainer}
                                >
                                    <Text style={styles.itemTitle}>{exp.role}</Text>
                                    <Text style={styles.itemSubtitle}>{exp.company}</Text>
                                    <Text style={styles.itemDate}>
                                        {formatDate(exp.startDate)}
                                        {exp.endDate ? ` - ${formatDate(exp.endDate)}` : ' - Atual'}
                                    </Text>
                                    {exp.description && (
                                        <View style={styles.bulletList}>
                                            {renderDescription(exp.description, `${exp.company}-${exp.role}`)}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {data.education && data.education.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.education')}</Text>
                            {data.education.map((edu) => (
                                <View
                                    key={`${edu.institution}-${edu.course}`}
                                    style={styles.itemContainer}
                                >
                                    <Text style={styles.itemTitle}>{edu.institution}</Text>
                                    <Text style={styles.itemSubtitle}>{edu.course}</Text>
                                    {(edu.startDate || edu.endDate) && (
                                        <Text style={styles.itemDate}>
                                            {formatDate(edu.startDate)}
                                            {edu.endDate ? ` - ${formatDate(edu.endDate)}` : ''}
                                        </Text>
                                    )}
                                    {edu.topics && (
                                        <Text style={styles.bodyText}>
                                            {edu.topics
                                                .split('\n')
                                                .map((text) => text.trim())
                                                .filter(Boolean)
                                                .join(', ')}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    
                    {data.projects && data.projects.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.projects')}</Text>
                            {data.projects.map((project) => (
                                <View
                                    key={`${project.name}-${project.id}`}
                                    style={styles.itemContainer}
                                >
                                    <Text style={styles.itemTitle}>{project.name}</Text>
                                    {project.technologies && (
                                        <Text style={styles.itemSubtitle}>{project.technologies}</Text>
                                    )}
                                    {(project.startDate || project.endDate) && (
                                        <Text style={styles.itemDate}>
                                            {formatDate(project.startDate)}
                                            {project.endDate ? ` - ${formatDate(project.endDate)}` : ''}
                                        </Text>
                                    )}
                                    {project.description && (
                                        <View style={styles.bulletList}>
                                            {renderDescription(project.description, `project-${project.id || project.name}`)}
                                        </View>
                                    )}
                                    {project.link && (
                                        <Text style={styles.bodyText}>
                                            {t('pdf.linkLabel')}: {project.link}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {skillsList.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.skills')}</Text>
                            {skillsList.map((skill) => (
                                <Text key={skill} style={styles.bodyText}>
                                    {skill.trim().replace(/^•\s*/, '')}
                                </Text>
                            ))}
                        </View>
                    )}

                    {langsList.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.languages')}</Text>
                            {langsList.map((lang) => (
                                <Text key={lang} style={styles.bodyText}>
                                    {lang.trim()}
                                </Text>
                            ))}
                        </View>
                    )}

                    {softList.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.softSkills')}</Text>
                            {softList.map((s) => (
                                <Text key={s} style={styles.bodyText}>
                                    {s.trim()}
                                </Text>
                            ))}
                        </View>
                    )}

                    {data.interpersonalSkills && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.interpersonalSkills')}</Text>
                            <View style={styles.bulletList}>
                                {renderDescription(data.interpersonalSkills, 'interpersonal')}
                            </View>
                        </View>
                    )}

                    {data.references && data.references.length > 0 && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.references')}</Text>
                            {data.references.map((ref) => (
                                <View
                                    key={`${ref.name}-${ref.email || ref.phone}`}
                                    style={styles.itemContainer}
                                >
                                    <Text style={styles.itemTitle}>{ref.name}</Text>
                                    {ref.email && (
                                        <Text style={styles.bodyText}>E-mail: {ref.email}</Text>
                                    )}
                                    {ref.phone && (
                                        <Text style={styles.bodyText}>
                                            Telefone: {ref.phone}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};
