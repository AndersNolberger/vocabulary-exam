import apiClient from './client';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  tier: number;
  current: number;
  target: number;
  unlocked: boolean;
}

export interface WordSetStatistics {
  wordSetId: number;
  completedRounds: number;
  accuracyPercent: number;
  bestAccuracyPercent: number;
  wordsToPractice: number;
  difficultWords: number;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  completedRounds: number;
  correctAnswers: number;
  totalAnswers: number;
  achievements: Achievement[];
  wordSets: WordSetStatistics[];
}

export interface RoundCompletion {
  earnedXp: number;
  level: number;
  leveledUp: boolean;
  newAchievements: Achievement[];
}

export const fetchProgress = async (): Promise<UserProgress> => {
  const response = await apiClient.get<UserProgress>('/progress');
  return response.data;
};
