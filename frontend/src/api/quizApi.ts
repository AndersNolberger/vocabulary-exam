import apiClient from './client';
import { QuizQuestion } from '../types';
import { RoundCompletion } from './progressApi';

export interface QuizRound {
  roundId: string;
  questions: QuizQuestion[];
}

export const startQuizRound = async (wordSetId: number, typed: boolean, previousRoundId?: string, difficultOnly = false,
  selectedQuestionIds?: number[], mode = typed ? 'typed' : 'choice'): Promise<QuizRound> => {
  const response = await apiClient.post<QuizRound>('/progress/rounds', {
    wordSetId, typed, previousRoundId, difficultOnly, selectedQuestionIds, mode,
  });
  return response.data;
};

export interface QuizAnswerResult {
  isCorrect: boolean;
  capitalizationOnly: boolean;
  correctAnswer: string | null;
  exampleAndInflections: string | null;
  completion: RoundCompletion | null;
}

export const submitAnswer = async (roundId: string, questionId: number, answer: string): Promise<QuizAnswerResult> => {
  const response = await apiClient.post<QuizAnswerResult>(`/progress/rounds/${roundId}/answers`, { questionId, answer });
  return response.data;
};
