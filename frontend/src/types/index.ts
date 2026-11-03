export interface WordPair {
  id?: number;
  swedishWord: string;
  foreignWord: string;
}

export interface WordSet {
  id: number;
  name: string;
  wordPairs: WordPair[];
}

export interface QuizQuestion {
  id: number;
  swedishWord: string;
  germanOptions: string[];
  isTypedAnswer: boolean;
}
