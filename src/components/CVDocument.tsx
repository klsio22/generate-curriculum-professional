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
import styles from '../styles/pdfStyles';
import type { CVData } from '../types';
import { formatDate, normalizeUrl } from '../utils/textUtils';
import type { ReactNode } from 'react';

export interface PDFPreviewProps {
    data: CVData;
}

export const CVDocument = ({ data }: PDFPreviewProps) => {
    const { t } = useTranslation();
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

            // Skip empty lines and reset subheading context
            if (!trimmedLineText) {
                isInsideSubheading = false;
                return;
            }

            // Line ending with ':' is treated as a subheading
            if (trimmedLineText.endsWith(':')) {
                renderedElements.push(
                    <Text key={`${elementKeyPrefix}-subheading-${lineIndex}`} style={styles.subHeading}>
                        {trimmedLineText}
                    </Text>
                );
                isInsideSubheading = true;
            }
            // Lines after a subheading are indented as bullet items
            else if (isInsideSubheading) {
                renderedElements.push(
                    <Text key={`${elementKeyPrefix}-subitem-${lineIndex}`} style={styles.bulletItem}>
                        {trimmedLineText}
                    </Text>
                );
            }
            // Regular lines (without preceding subheading)
            else {
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
        <Document>
            <Page size="A4" style={styles.page}>
                {/* MAIN CONTENT */}
                <View style={styles.mainContent}>
                    {/* Header */}
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
                                            <Svg width={18} height={18} style={{ marginRight: 6 }} viewBox="0 0 256 256">
                                                <Path
                                                    d="M216,24H40A16,16,0,0,0,24,40V216a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V40A16,16,0,0,0,216,24Zm0,192H40V40H216V216ZM96,112v64a8,8,0,0,1-16,0V112a8,8,0,0,1,16,0Zm88,28v36a8,8,0,0,1-16,0V140a20,20,0,0,0-40,0v36a8,8,0,0,1-16,0V112a8,8,0,0,1,15.79-1.78A36,36,0,0,1,184,140ZM100,84A12,12,0,1,1,88,72,12,12,0,0,1,100,84Z"
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
                                            <Svg width={18} height={18} style={{ marginRight: 6 }} viewBox="0 0 24 24">
                                                <Path
                                                    d="M12 .297C5.373 .297 0 5.67 0 12.297c0 5.297 3.438 9.792 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.612-4.042-1.612-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.808 1.305 3.492.998.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.468-2.381 1.235-3.221-.123-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.654 1.653.243 2.874.12 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.803 5.62-5.475 5.92.43.372.814 1.103.814 2.222 0 1.606-.015 2.896-.015 3.286 0 .32.216.694.825.576C20.565 22.086 24 17.594 24 12.297 24 5.67 18.627 .297 12 .297z"
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

                    {/* Objective */}
                    {data.objective && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.profile')}</Text>
                            <Text style={styles.objective}>{data.objective}</Text>
                        </View>
                    )}

                    {/* Experience */}
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

                    {/* Education */}
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

                    
                    {/* Projects (Academic & Technical consolidated) */}
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

                    {/* All Skills */}
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

                    {/* Languages */}
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

                    {/* Soft Skills */}
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

                    {/* Interpersonal Competencies Demonstrated */}
                    {data.interpersonalSkills && (
                        <View style={styles.sectionContent}>
                            <Text style={styles.sectionTitle}>{t('pdf.interpersonalSkills')}</Text>
                            <View style={styles.bulletList}>
                                {renderDescription(data.interpersonalSkills, 'interpersonal')}
                            </View>
                        </View>
                    )}

                    {/* References */}
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
