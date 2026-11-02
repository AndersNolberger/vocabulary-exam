import apiClient from './client';

export const checkWords = async (words: string[], signal?: AbortSignal, ignoreCase = false): Promise<string[]> => {
  const response = await apiClient.post<string[]>('/spellcheck/check', words, { signal, params: { ignoreCase } });
  return response.data;
};
