import apiClient from './client';
import { QuizQuestion } from '../types';

export const fetchQuizQuestions = async (wordSetId: number, typed: boolean): Promise<QuizQuestion[]> => {
  const response = await apiClient.get(`/quiz/${wordSetId}`, { params: { typed } });
  return response.data;
};

export interface QuizAnswerResult {
  isCorrect: boolean;
  capitalizationOnly: boolean;
}

export const submitAnswer = async (questionId: number, answer: string): Promise<QuizAnswerResult> => {
  const response = await apiClient.post<QuizAnswerResult>('/quiz/submit', { questionId, answer });
  return response.data;
};
