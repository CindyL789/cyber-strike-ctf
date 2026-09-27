export type Category = 'Web' | 'Crypto' | 'Reverse' | 'Forensics' | 'Pwn';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane';
export type UserRole = 'player' | 'admin';

export interface Hint {
  id: string;
  cost: number;
  text: string;
}

export interface Challenge {
  id: string;
  title: string;
  category: Category;
  difficulty: Difficulty;
  points: number;
  author: string;
  solvesCount: number;
  flag: string;
  description: string;
  tags: string[];
  hints: Hint[];
  writeup: string;
  initialState?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  score: number;
  solvesCount: number;
  solvedChallengeIds: string[];
  unlockedHintIds: string[];
  categoryBreakdown: Record<Category, number>;
  role: UserRole;
  lastSolveTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamScore {
  id: string;
  name: string;
  avatar: string;
  score: number;
  solves: number;
  lastSolveTime: string;
  categoryBreakdown: Record<Category, number>;
  isUser?: boolean;
}

export interface ActivityEvent {
  id: string;
  teamName: string;
  challengeTitle: string;
  category: Category;
  points: number;
  timestamp: string;
  isFirstBlood?: boolean;
  isUser?: boolean;
  userId?: string;
}
