import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  setDoc,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Challenge, ActivityEvent, UserProfile } from '../types/ctf';
import { INITIAL_CHALLENGES } from '../data/challenges';

const CHALLENGES_COLLECTION = 'challenges';
const ACTIVITY_COLLECTION = 'activity';
const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';

export function subscribeToChallenges(callback: (challenges: Challenge[]) => void) {
  const challengesRef = collection(db, CHALLENGES_COLLECTION);
  return onSnapshot(
    challengesRef,
    snapshot => {
      if (snapshot.empty) {
        // Seed default challenges if empty
        INITIAL_CHALLENGES.forEach(async c => {
          try {
            await setDoc(doc(db, CHALLENGES_COLLECTION, c.id), c);
          } catch {
            // Seeding fallback
          }
        });
        callback(INITIAL_CHALLENGES);
      } else {
        const list: Challenge[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Challenge);
        });
        callback(list);
      }
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, CHALLENGES_COLLECTION);
      callback(INITIAL_CHALLENGES);
    }
  );
}

export function subscribeToActivity(callback: (activities: ActivityEvent[]) => void) {
  const activityRef = collection(db, ACTIVITY_COLLECTION);
  return onSnapshot(
    activityRef,
    snapshot => {
      const list: ActivityEvent[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityEvent, 'id'>) });
      });
      list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      callback(list.slice(0, 30));
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, ACTIVITY_COLLECTION);
    }
  );
}

export async function submitFlag(
  user: UserProfile,
  challenge: Challenge,
  candidateFlag: string,
  isDailyOp: boolean = false
): Promise<{ success: boolean; earnedPoints: number; message: string }> {
  const normalizedCandidate = candidateFlag.trim().toLowerCase();
  const normalizedCorrect = challenge.flag.trim().toLowerCase();

  if (normalizedCandidate !== normalizedCorrect) {
    return { success: false, earnedPoints: 0, message: 'Incorrect flag.' };
  }

  if (user.solvedChallengeIds.includes(challenge.id)) {
    return { success: true, earnedPoints: 0, message: 'Challenge already solved!' };
  }

  // Calculate hint penalties
  const usedHints = challenge.hints.filter(h => user.unlockedHintIds.includes(h.id));
  const totalPenalty = usedHints.reduce((acc, h) => acc + h.cost, 0);
  const totalEarned = Math.max(10, challenge.points - totalPenalty);

  // Daily Ops bonuses
  const todayStr = new Date().toISOString().split('T')[0];
  const lastDaily = user.lastDailySolveDate;
  let newStreak = user.dailyStreak || 0;
  if (isDailyOp) {
    if (!lastDaily) {
      newStreak = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDaily === yesterdayStr) {
        newStreak += 1;
      } else if (lastDaily !== todayStr) {
        newStreak = 1;
      }
    }
  }

  const newScore = user.score + totalEarned;
  const newSolvesCount = user.solvesCount + 1;
  const newSolved = [...user.solvedChallengeIds, challenge.id];
  const newBreakdown = {
    ...user.categoryBreakdown,
    [challenge.category]: (user.categoryBreakdown[challenge.category] || 0) + totalEarned
  };

  const isFirstBlood = challenge.solvesCount === 0;
  const hasBooster = Boolean(user.tokenBoosterCount && user.tokenBoosterCount > 0);
  const baseTokenReward = isDailyOp ? 150 : 50;
  const tokenReward = hasBooster ? baseTokenReward * 2 : baseTokenReward;
  const currentTokens = user.tokens ?? 250;
  const newTokens = currentTokens + tokenReward;

  try {
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

    if (hasBooster) {
      profileUpdate.tokenBoosterCount = Math.max(0, (user.tokenBoosterCount || 1) - 1);
    }

    if (isDailyOp) {
      profileUpdate.dailyStreak = newStreak;
      profileUpdate.lastDailySolveDate = todayStr;
      profileUpdate.dailySolvesCount = (user.dailySolvesCount || 0) + 1;
      if (newStreak > (user.dailyStreakRecord || 0)) {
        profileUpdate.dailyStreakRecord = newStreak;
      }
    }

    await updateDoc(userRef, profileUpdate);

    // 2. Increment challenge solve count
    const chRef = doc(db, CHALLENGES_COLLECTION, challenge.id);
    await updateDoc(chRef, {
      solvesCount: increment(1)
    });

    // 3. Post to activity feed
    await addDoc(collection(db, ACTIVITY_COLLECTION), {
      teamName: user.teamName || user.username,
      challengeTitle: challenge.title,
      category: challenge.category,
      points: totalEarned,
      timestamp: 'Just now',
      isFirstBlood
    });

    // 4. Update team aggregates if member
    if (user.teamId) {
      try {
        const teamRef = doc(db, TEAMS_COLLECTION, user.teamId);
        await updateDoc(teamRef, {
          score: increment(totalEarned),
          solves: increment(1),
          lastSolveTime: 'Just now'
        });
      } catch {
        // Continue
      }
    }

    return {
      success: true,
      earnedPoints: totalEarned,
      message: `Flag Captured! +${totalEarned} pts awarded & +${tokenReward} Cyber Credits granted!`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

export async function unlockHint(
  user: UserProfile,
  challengeId: string,
  hintId: string,
  cost: number
): Promise<void> {
  if (user.unlockedHintIds.includes(hintId)) return;

  const newUnlocked = [...user.unlockedHintIds, hintId];
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      unlockedHintIds: newUnlocked,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}
