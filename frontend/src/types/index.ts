export interface WordPair {
  id?: number;
  swedishWord: string;
  foreignWord: string;
  exampleAndInflections?: string | null;
}

export type ForeignLanguage = 'German' | 'French';

export interface WordSet {
  id: number;
  name: string;
  foreignLanguage: ForeignLanguage;
  wordPairs: WordPair[];
}

export interface QuizQuestion {
  id: number;
  swedishWord: string;
  prompt: string;
  foreignOptions: string[];
  isTypedAnswer: boolean;
}
