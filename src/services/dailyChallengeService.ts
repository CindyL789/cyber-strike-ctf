import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Challenge, UserProfile, DailyOpInfo } from '../types/ctf';
import { DAILY_CHALLENGES_POOL } from '../data/dailyChallenges';

const DAILY_CONFIG_DOC = 'current';
const DAILY_CONFIG_COLLECTION = 'daily_config';
const CHALLENGES_COLLECTION = 'challenges';

// Get ISO date string (YYYY-MM-DD) in UTC
export function getUtcDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Compute day name (Monday, Tuesday, etc.)
export function getUtcDayName(date: Date = new Date()): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getUTCDay()];
}

// Calculates time remaining until 00:00:00 UTC tomorrow
export function getTimeUntilUtcMidnight(): { text: string; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diffMs = tomorrow.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return {
    text: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    seconds: totalSeconds
  };
}

// Deterministically select challenge from pool based on date
export function getDeterministicDailyChallenge(dateStr: string): Challenge {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES_POOL.length;
  const base = DAILY_CHALLENGES_POOL[index];
  return {
    ...base,
    isDaily: true,
    dailyDate: dateStr,
    dailyBonusPoints: base.dailyBonusPoints || 100
  };
}

// Ensure today's daily challenge is seeded in Firestore
export async function ensureDailyChallengePublished(): Promise<Challenge> {
  const todayStr = getUtcDateString();
  const defaultDaily = getDeterministicDailyChallenge(todayStr);

  try {
    const configRef = doc(db, DAILY_CONFIG_COLLECTION, DAILY_CONFIG_DOC);
    const configSnap = await getDoc(configRef);

    let activeChallengeId = defaultDaily.id;

    if (configSnap.exists()) {
      const data = configSnap.data();
      if (data.date === todayStr && data.challengeId) {
        activeChallengeId = data.challengeId;
      } else {
        // Date changed, update daily config
        await setDoc(configRef, {
          date: todayStr,
          challengeId: defaultDaily.id,
          bonusPoints: 100,
          theme: `${getUtcDayName()} Cyber Strike Op`,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } else {
      // First time initialization
      await setDoc(configRef, {
        date: todayStr,
        challengeId: defaultDaily.id,
        bonusPoints: 100,
        theme: `${getUtcDayName()} Cyber Strike Op`,
        updatedAt: new Date().toISOString()
      });
    }

    // Ensure all pool challenges exist in challenges collection so they can be solved
    for (const poolCh of DAILY_CHALLENGES_POOL) {
      const chRef = doc(db, CHALLENGES_COLLECTION, poolCh.id);
      const chSnap = await getDoc(chRef);
      if (!chSnap.exists()) {
        await setDoc(chRef, {
          ...poolCh,
          isDaily: true,
          dailyDate: poolCh.id === activeChallengeId ? todayStr : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    const activeCh = DAILY_CHALLENGES_POOL.find(c => c.id === activeChallengeId) || defaultDaily;
    return activeCh;
  } catch (err) {
    console.warn('Daily challenge Firestore sync notice (offline/fallback mode):', err);
    return defaultDaily;
  }
}

// Compute daily challenge status for the UI
export function getDailyOpInfo(
  challenges: Challenge[],
  userProfile: UserProfile | null,
  overrideChallengeId?: string | null
): DailyOpInfo {
  const todayStr = getUtcDateString();
  const dayName = getUtcDayName();
  const { text, seconds } = getTimeUntilUtcMidnight();

  let targetCh: Challenge | undefined;

  if (overrideChallengeId) {
    targetCh = challenges.find(c => c.id === overrideChallengeId);
  }

  if (!targetCh) {
    // Look for challenge marked with today's date
    targetCh = challenges.find(c => c.isDaily && c.dailyDate === todayStr);
  }

  if (!targetCh) {
    // Deterministic fallback from pool or challenges list
    const defaultDaily = getDeterministicDailyChallenge(todayStr);
    targetCh = challenges.find(c => c.id === defaultDaily.id) || defaultDaily;
  }

  const isSolvedToday = userProfile
    ? (userProfile.solvedChallengeIds || []).includes(targetCh.id)
    : false;

  return {
    challengeId: targetCh.id,
    challenge: targetCh,
    date: todayStr,
    dayName,
    bonusPoints: targetCh.dailyBonusPoints || 100,
    timeRemaining: text,
    secondsRemaining: seconds,
    isSolvedToday,
    totalDailyAvailable: DAILY_CHALLENGES_POOL.length
  };
}

// Admin: Force rotate to another daily challenge
export async function forceRotateDailyChallenge(nextChallengeId?: string): Promise<void> {
  const todayStr = getUtcDateString();
  const configRef = doc(db, DAILY_CONFIG_COLLECTION, DAILY_CONFIG_DOC);

  let targetId = nextChallengeId;
  if (!targetId) {
    // Pick next one from pool
    const currentSnap = await getDoc(configRef);
    const currentId = currentSnap.exists() ? currentSnap.data().challengeId : '';
    const currentIndex = DAILY_CHALLENGES_POOL.findIndex(c => c.id === currentId);
    const nextIndex = (currentIndex + 1) % DAILY_CHALLENGES_POOL.length;
    targetId = DAILY_CHALLENGES_POOL[nextIndex].id;
  }

  const targetCh = DAILY_CHALLENGES_POOL.find(c => c.id === targetId);

  await setDoc(configRef, {
    date: todayStr,
    challengeId: targetId,
    bonusPoints: 100,
    theme: `${targetCh?.category || 'Special'} Daily Op`,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Update challenge in challenges collection
  if (targetCh) {
    const chRef = doc(db, CHALLENGES_COLLECTION, targetCh.id);
    await setDoc(chRef, {
      ...targetCh,
      isDaily: true,
      dailyDate: todayStr,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}
