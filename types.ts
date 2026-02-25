
export type QuestionType = 'choice' | 'text' | 'group';

export interface SubQuestion {
  id: string;
  content: string;
  correctAnswer: boolean;
  image?: string;
}

export interface Question {
  id: number;
  type: QuestionType;
  section?: string;
  question: string;
  image?: string; // Base64 string for question image
  options?: string[];
  optionImages?: string[]; // Base64 strings for each option
  answer?: string;
  subQuestions?: SubQuestion[];
  mixQuestion?: boolean;
  mixOptions?: boolean;
}

export interface StudentResult {
  id: string;
  name: string;
  className: string;
  email?: string;
  score: number;
  total: number;
  date?: string;
  timeSpent?: number;
  violations: number;
  counts: {
    correct: number;
    wrong: number;
    empty: number;
  };
  answers?: any;
}

export interface GradingConfig {
  part1Total: number;
  part2Total: number;
  part3Total: number;
  part4Total: number;
  groupGradingMethod: 'progressive' | 'equal';
  startTime?: string;
  endTime?: string;
}

export interface ExamConfig {
  id: string;
  code: string;
  securityCode: string;
  title: string;
  className: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  maxAttempts?: number;
  maxViolations?: number;
  gradingConfig?: GradingConfig;
  allowHints: boolean;
  allowReview: boolean;
  questions: Question[];
  results: StudentResult[];
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  className: string;
  email?: string;
  isApproved?: boolean;
}

export type UserRole = 'teacher' | 'student' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  className?: string;
  school?: string;
  isApproved?: boolean;
  createdAt?: string;
}

export const INITIAL_QUESTIONS: Question[] = [];
