import type { Timestamp } from 'firebase/firestore';

export interface ResumeMeta {
  storagePath: string;
  fileName: string;
  updatedAt: Timestamp;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: Timestamp;
  replyText?: string;
  repliedAt?: Timestamp;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  featured?: boolean;
  order?: number;
  createdAt: Timestamp;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  start: string;
  end: string;
  details?: string;
}

export interface AboutData {
  name: string;
  title: string;
  summary: string;
  location: string;
  email: string;
  socials: {
    github: string;
    linkedin: string;
  };
  resumeUrl?: string;   // legacy field kept for compatibility
  resume?: ResumeMeta;  // current model: storagePath + fileName + updatedAt
}

export interface SiteContent {
  about: AboutData;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
