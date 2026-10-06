export type Category = 'Web' | 'Crypto' | 'Reverse' | 'Forensics' | 'Pwn';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Insane' | 'Nightmare';
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
  dailyBonusPoints?: number;
  isDaily?: boolean;
  author: string;
  solvesCount: number;
  flag: string;
  description: string;
  tags: string[];
  hints: Hint[];
  writeup?: string;
  initialState?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  description: string;
  captainId: string;
  captainName: string;
  memberIds: string[];
  inviteCode: string;
  score: number;
  solvesCount: number;
  solvedChallengeIds: string[];
  categoryBreakdown: Record<Category, number>;
  isOpen: boolean;
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
  memberCount?: number;
  captainId?: string;
  memberIds?: string[];
  teamTag?: string;
  badgeTitle?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  score: number;
  solvesCount: number;
  solvedChallengeIds: string[];
  unlockedHintIds: string[];
  tokens?: number;
  claimedTop5Reward?: boolean;
  badgeTitle?: string;
  lastDailyTokenClaimDate?: string;
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
  inventory?: string[];
  hasRadarLicense?: boolean;
  tokenBoosterCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArmoryItem {
  id: string;
  name: string;
  category: 'title' | 'perk' | 'booster';
  tokenCost: number;
  badge: string;
  description: string;
  effect: string;
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

export interface ActivityEvent {
  id: string;
  userId?: string;
  teamName: string;
  challengeTitle: string;
  category: Category;
  points: number;
  timestamp: string;
  isFirstBlood?: boolean;
  isUser?: boolean;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  priceUsd: number;
  badge: string;
  popular?: boolean;
  perks: string[];
}

export interface Top5RewardTier {
  rank: number;
  title: string;
  tokensReward: number;
  badge: string;
  frameColor: string;
  badgeColor: string;
  summary: string;
  perks: string[];
}
