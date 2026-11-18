export interface Education {
  id: string;
  course: string;
  institution: string;
  startDate: string;
  endDate: string;
  topics?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements?: string[];
}

export interface Reference {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface CVMeta {
  targetJob?: string;
  company?: string;
  keywords?: string[];
  sourceCvId?: string;
  createdByAI?: boolean;
}

export interface CVData {
  fullName: string;
  jobTitle: string;
  address: string;
  phone: string;
  email: string;
  linkedin: string;
  linkedinName?: string;
  github?: string;
  githubName?: string;
  portfolio?: string;
  portfolioName?: string;
  objective: string;
  education: Education[];
  experience: Experience[];
  projects?: Project[];
  skills: string;
  languages?: string;
  softSkills?: string;
  interpersonalSkills?: string;
  
  references?: Reference[];

  meta?: CVMeta;
}

export interface SavedCV extends CVData {
  id: string;
  title: string;
  updatedAt: number;
}
