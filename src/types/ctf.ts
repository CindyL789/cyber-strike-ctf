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
  isDaily?: boolean;
  dailyDate?: string;
  dailyBonusPoints?: number;
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
  teamId?: string | null;
  teamName?: string | null;
  teamTag?: string | null;
  isCaptain?: boolean;
  lastSolveTime?: string;
  dailyStreak?: number;
  lastDailySolveDate?: string;
  dailyStreakRecord?: number;
  dailySolvesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyOpInfo {
  challengeId: string;
  challenge: Challenge;
  date: string;
  dayName: string;
  bonusPoints: number;
  timeRemaining: string;
  secondsRemaining: number;
  isSolvedToday: boolean;
  totalDailyAvailable: number;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  description?: string;
  captainId: string;
  captainName: string;
  memberIds: string[];
  inviteCode: string;
  score: number;
  solvesCount: number;
  solvedChallengeIds: string[];
  categoryBreakdown: Record<Category, number>;
  isOpen?: boolean;
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
  isTeam?: boolean;
  teamTag?: string;
  memberCount?: number;
  captainName?: string;
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
