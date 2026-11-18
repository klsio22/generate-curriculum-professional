import type { SavedCV } from '@/types/cv';

export const BACKUP_VERSION = 1;

export interface BackupFile {
  version: number;
  exportedAt: string;
  activeId: string | null;
  cvs: SavedCV[];
}

export interface ParsedBackup {
  cvs: SavedCV[];
  activeId: string | null;
  exportedAt: string | null;
}

export class BackupError extends Error {
  readonly code: 'not_json' | 'no_resumes';

  constructor(code: 'not_json' | 'no_resumes') {
    super(code);
    this.name = 'BackupError';
    this.code = code;
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const TEXT_FIELDS = [
  'fullName',
  'jobTitle',
  'address',
  'phone',
  'email',
  'linkedin',
  'linkedinName',
  'github',
  'githubName',
  'portfolio',
  'portfolioName',
  'objective',
  'skills',
  'languages',
  'softSkills',
  'interpersonalSkills',
] as const;

export const sanitizeImportedCV = (item: unknown): SavedCV | null => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const candidate = item as Partial<SavedCV> & Record<string, unknown>;
  if (!isNonEmptyString(candidate.id)) return null;
  if (!isNonEmptyString(candidate.title) && !isNonEmptyString(candidate.fullName)) return null;
  if (!Array.isArray(candidate.education) || !Array.isArray(candidate.experience)) return null;

  const text = Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, typeof candidate[field] === 'string' ? candidate[field] : '']),
  ) as Pick<SavedCV, (typeof TEXT_FIELDS)[number]>;

  return {
    ...candidate,
    ...text,
    id: candidate.id,
    title: isNonEmptyString(candidate.title) ? candidate.title : (candidate.fullName as string),
    updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : Date.now(),
    education: candidate.education,
    experience: candidate.experience,
    references: Array.isArray(candidate.references) ? candidate.references : [],
    projects: Array.isArray(candidate.projects) ? candidate.projects : [],
  } as SavedCV;
};

const resumeList = (parsed: unknown, record: Record<string, unknown> | null): unknown[] => {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(record?.cvs)) return record.cvs;
  return [];
};

export const parseBackupFile = (text: string): ParsedBackup => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('not_json');
  }

  const record = !Array.isArray(parsed) && parsed && typeof parsed === 'object'
    ? (parsed as Record<string, unknown>)
    : null;
  const list = resumeList(parsed, record);

  const cvs = list.map(sanitizeImportedCV).filter((cv): cv is SavedCV => cv !== null);
  if (cvs.length === 0) throw new BackupError('no_resumes');

  return {
    cvs,
    activeId: typeof record?.activeId === 'string' ? record.activeId : null,
    exportedAt: typeof record?.exportedAt === 'string' ? record.exportedAt : null,
  };
};

export const createBackup = (cvs: SavedCV[], activeId: string | null, now = new Date()): BackupFile => ({
  version: BACKUP_VERSION,
  exportedAt: now.toISOString(),
  activeId,
  cvs,
});

export const backupFileName = (language: string, now = new Date()): string => {
  const prefix = language.startsWith('pt') ? 'curriculos-backup' : 'resume-backup';
  return `${prefix}-${now.toISOString().slice(0, 10)}.json`;
};

export const mergeImportedCVs = (
  current: SavedCV[],
  incoming: SavedCV[],
  restoredSuffix: string,
  newId: () => string = () => crypto.randomUUID(),
): SavedCV[] => {
  const usedIds = new Set(current.map((cv) => cv.id));
  const added = incoming.map((cv) => {
    if (!usedIds.has(cv.id)) {
      usedIds.add(cv.id);
      return cv;
    }
    let id = newId();
    while (usedIds.has(id)) id = newId();
    usedIds.add(id);
    return { ...cv, id, title: `${cv.title} ${restoredSuffix}` };
  });
  return [...current, ...added];
};
