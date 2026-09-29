import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  increment,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Challenge, UserProfile, ActivityEvent, Category } from '../types/ctf';
import { INITIAL_CHALLENGES } from '../data/challenges';
import { DAILY_CHALLENGES_POOL } from '../data/dailyChallenges';
import { syncSolveToTeam } from './teamService';

const ALL_DEFAULT_CHALLENGES: Challenge[] = [...INITIAL_CHALLENGES, ...DAILY_CHALLENGES_POOL];

const CHALLENGES_COLLECTION = 'challenges';
const ACTIVITY_COLLECTION = 'activity';
const USERS_COLLECTION = 'users';

// Subscribes to challenges collection, automatically seeding INITIAL_CHALLENGES & DAILY_CHALLENGES if empty
export function subscribeToChallenges(
  onUpdate: (challenges: Challenge[]) => void
): () => void {
  const colRef = collection(db, CHALLENGES_COLLECTION);

  // Check if seeding is needed
  getDocs(colRef)
    .then(snap => {
      if (snap.empty) {
        // Seed all default challenges
        const seedPromises = ALL_DEFAULT_CHALLENGES.map(ch => {
          return setDoc(doc(db, CHALLENGES_COLLECTION, ch.id), {
            ...ch,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
        return Promise.all(seedPromises);
      } else {
        // Seed any missing challenges from default catalogue (e.g. newly introduced daily challenges)
        const existingIds = new Set(snap.docs.map(d => d.id));
        const missing = ALL_DEFAULT_CHALLENGES.filter(ch => !existingIds.has(ch.id));
        if (missing.length > 0) {
          const syncPromises = missing.map(ch => {
            return setDoc(doc(db, CHALLENGES_COLLECTION, ch.id), {
              ...ch,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
          return Promise.all(syncPromises);
        }
      }
    })
    .catch(err => {
      console.warn('Initial challenge check failed or offline fallback:', err);
    });

  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      if (snapshot.empty) {
        // Fallback to local default while seeding completes
        onUpdate(ALL_DEFAULT_CHALLENGES);
        return;
      }
      const list: Challenge[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Challenge);
      });
      onUpdate(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, CHALLENGES_COLLECTION);
      onUpdate(ALL_DEFAULT_CHALLENGES);
    }
  );

  return unsubscribe;
}

// Subscribes to live activity stream
export function subscribeToActivity(
  onUpdate: (events: ActivityEvent[]) => void
): () => void {
  const colRef = collection(db, ACTIVITY_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const list: ActivityEvent[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as ActivityEvent);
      });
      // Sort newest first
      list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      onUpdate(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, ACTIVITY_COLLECTION);
    }
  );

  return unsubscribe;
}

// Admin: Create Challenge
export async function createChallenge(challenge: Omit<Challenge, 'solvesCount'>): Promise<void> {
  const id = challenge.id?.trim() || `ch-${Date.now()}`;
  const docRef = doc(db, CHALLENGES_COLLECTION, id);

  const payload: Challenge = {
    ...challenge,
    id,
    solvesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${CHALLENGES_COLLECTION}/${id}`);
    throw err;
  }
}

// Admin: Update Challenge
export async function updateChallenge(
  challengeId: string,
  updatedFields: Partial<Challenge>
): Promise<void> {
  const docRef = doc(db, CHALLENGES_COLLECTION, challengeId);
  try {
    await updateDoc(docRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${CHALLENGES_COLLECTION}/${challengeId}`);
    throw err;
  }
}

// Admin: Delete Challenge
export async function deleteChallenge(challengeId: string): Promise<void> {
  const docRef = doc(db, CHALLENGES_COLLECTION, challengeId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${CHALLENGES_COLLECTION}/${challengeId}`);
    throw err;
  }
}

// Submit Flag & Sync Score
export async function submitFlag(
  user: UserProfile,
  challenge: Challenge,
  flagInput: string
): Promise<{ success: boolean; message: string }> {
  if (flagInput.trim() !== challenge.flag.trim()) {
    return { success: false, message: 'Incorrect flag. Inspect logs or check casing.' };
  }

  if (user.solvedChallengeIds.includes(challenge.id)) {
    return { success: true, message: 'Already captured previously.' };
  }

  // Calculate daily streak and bonus
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let dailyBonus = 0;
  let newStreak = user.dailyStreak || 0;
  let newDailySolves = user.dailySolvesCount || 0;
  let isDailyOp = Boolean(challenge.isDaily);

  if (isDailyOp) {
    dailyBonus = challenge.dailyBonusPoints || 100;
    newDailySolves += 1;
    if (user.lastDailySolveDate === todayStr) {
      newStreak = user.dailyStreak || 1;
    } else if (user.lastDailySolveDate === yesterdayDate) {
      newStreak = (user.dailyStreak || 0) + 1;
    } else {
      newStreak = 1;
    }
  }

  // Calculate updated metrics
  const newSolved = [...user.solvedChallengeIds, challenge.id];
  const totalEarned = challenge.points + dailyBonus;
  const newScore = user.score + totalEarned;
  const newSolvesCount = user.solvesCount + 1;
  const newBreakdown = {
    ...user.categoryBreakdown,
    [challenge.category]: (user.categoryBreakdown[challenge.category] || 0) + totalEarned
  };

  const isFirstBlood = challenge.solvesCount === 0;
  const tokenReward = isDailyOp ? 150 : 50;
  const currentTokens = user.tokens ?? 250;
  const newTokens = currentTokens + tokenReward;

  try {
    // 1. Update user profile in Firestore
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const profileUpdate: Record<string, unknown> = {
      solvedChallengeIds: newSolved,
      score: newScore,
      tokens: newTokens,
      solvesCount: newSolvesCount,
      categoryBreakdown: newBreakdown,
      lastSolveTime: 'Just now',
      updatedAt: new Date().toISOString()
    };

    if (isDailyOp) {
      profileUpdate.dailyStreak = newStreak;
      profileUpdate.lastDailySolveDate = todayStr;
      profileUpdate.dailyStreakRecord = Math.max(user.dailyStreakRecord || 0, newStreak);
      profileUpdate.dailySolvesCount = newDailySolves;
    }

    await updateDoc(userRef, profileUpdate);

    // 2. Increment challenge solvesCount
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challenge.id);
    await updateDoc(challengeRef, {
      solvesCount: increment(1),
      updatedAt: new Date().toISOString()
    });

    // 3. If user belongs to a team, sync solve to aggregate team score & challenges
    if (user.teamId) {
      syncSolveToTeam(user.teamId, challenge).catch(err => {
        console.warn('Team progress sync error:', err);
      });
    }

    // 4. Broadcast live activity event
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    const displayTeamName = user.teamTag
      ? `[${user.teamTag}] ${user.username}`
      : user.teamName
      ? `${user.username} (${user.teamName})`
      : user.username;

    const activityTitle = isDailyOp
      ? `⚡ [Daily Op · Streak x${newStreak}] ${challenge.title}`
      : challenge.title;

    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId: user.uid,
      teamName: displayTeamName,
      challengeTitle: activityTitle,
      category: challenge.category,
      points: totalEarned,
      timestamp: 'Just now',
      isFirstBlood,
      isUser: true
    };
    await addDoc(activityCol, activityEvent);

    const bonusMsg = dailyBonus > 0 ? ` (+${dailyBonus} Daily Streak Bonus!) 🔥 ${newStreak}-day streak!` : '';
    return {
      success: true,
      message: `Flag Captured! +${totalEarned} points awarded.${bonusMsg}`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

// Unlock Hint & apply score penalty
export async function unlockHint(
  user: UserProfile,
  hintId: string,
  cost: number
): Promise<void> {
  if (user.unlockedHintIds.includes(hintId)) return;

  const newHints = [...user.unlockedHintIds, hintId];
  const newScore = Math.max(0, user.score - cost);

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      unlockedHintIds: newHints,
      score: newScore,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}
