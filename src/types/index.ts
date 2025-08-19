export interface QRData {
  subject: string;
  class: number;
  chapter: string;
  pdfFile?: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface UserProfile {
  name: string;
  email: string;
  questionsAsked: number;
  quizzesTaken: number;
  qrCodesScanned: number;
}

export interface LearningSession {
  id: string;
  subject: string;
  class: number;
  chapter: string;
  startTime: Date;
  endTime?: Date;
  questionsAsked: number;
  messages: Message[];
}

export type Subject = 'physics' | 'chemistry' | 'mathematics' | 'biology';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}
