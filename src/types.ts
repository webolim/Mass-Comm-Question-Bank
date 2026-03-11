export type QuestionType = 'mcqs' | 'objectives' | 'vsas' | 'sas' | 'las';

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}

export interface Objective {
  question: string;
  answer: string;
}

export interface VSA {
  question: string;
  answer: string;
}

export interface SA {
  question: string;
  answer: string;
}

export interface LA {
  question: string;
  answer: string;
}
