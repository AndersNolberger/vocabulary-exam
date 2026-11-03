import apiClient from './client';
import { ForeignLanguage, WordPair, WordSet } from '../types';

export const fetchWordSets = async (): Promise<WordSet[]> => {
  const response = await apiClient.get('/wordsets');
  return response.data;
};

export const createWordSet = async (name: string, wordPairs: WordPair[], foreignLanguage: ForeignLanguage): Promise<WordSet> => {
  const response = await apiClient.post('/wordsets', { name, wordPairs, foreignLanguage });
  return response.data;
};

export const fetchWordSet = async (id: number): Promise<WordSet> => {
  const response = await apiClient.get(`/wordsets/${id}`);
  return response.data;
};

export const updateWordSet = async (id: number, name: string, wordPairs: WordPair[], foreignLanguage: ForeignLanguage): Promise<WordSet> => {
  const response = await apiClient.put(`/wordsets/${id}`, { name, wordPairs, foreignLanguage });
  return response.data;
};

export const deleteWordSet = async (id: number): Promise<void> => {
  await apiClient.delete(`/wordsets/${id}`);
};
