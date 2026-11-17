export interface Education {
  id: string;
  course: string;
  institution: string;
  startDate: string;
  endDate: string;
  topics?: string; // multiline list of topics/courses seen at university
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements?: string[]; // Lista de conquistas/bullet points
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

export interface CVData {
  fullName: string;
  jobTitle: string; // Cargo/posição
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
  projects?: Project[]; // Projetos feitos e participados
  skills: string;
  languages?: string; // multiline list of languages
  softSkills?: string; // multiline list of soft skills
  interpersonalSkills?: string; // multiline field for demonstrated interpersonal competencies
  
  references?: Reference[];
}

export interface SavedCV extends CVData {
  id: string;
  title: string;
  updatedAt: number;
}
