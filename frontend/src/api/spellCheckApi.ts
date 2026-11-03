import apiClient from './client';
import { ForeignLanguage } from '../types';

export const checkWords = async (words: string[], signal?: AbortSignal, ignoreCase = false,
  language: ForeignLanguage = 'German'): Promise<string[]> => {
  const response = await apiClient.post<string[]>('/spellcheck/check', words, { signal, params: { ignoreCase, language } });
  return response.data;
};
