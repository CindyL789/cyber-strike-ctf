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

const CHALLENGES_COLLECTION = 'challenges';
const ACTIVITY_COLLECTION = 'activity';
const USERS_COLLECTION = 'users';

// Subscribes to challenges collection, automatically seeding INITIAL_CHALLENGES if empty
export function subscribeToChallenges(
  onUpdate: (challenges: Challenge[]) => void
): () => void {
  const colRef = collection(db, CHALLENGES_COLLECTION);

  // Check if seeding is needed
  getDocs(colRef)
    .then(snap => {
      if (snap.empty) {
        // Seed all default challenges
        const seedPromises = INITIAL_CHALLENGES.map(ch => {
          return setDoc(doc(db, CHALLENGES_COLLECTION, ch.id), {
            ...ch,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        });
        return Promise.all(seedPromises);
      } else {
        // Seed any missing challenges from INITIAL_CHALLENGES (e.g. newly introduced harder challenges)
        const existingIds = new Set(snap.docs.map(d => d.id));
        const missing = INITIAL_CHALLENGES.filter(ch => !existingIds.has(ch.id));
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
        onUpdate(INITIAL_CHALLENGES);
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
      onUpdate(INITIAL_CHALLENGES);
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

  // Calculate updated metrics
  const newSolved = [...user.solvedChallengeIds, challenge.id];
  const newScore = user.score + challenge.points;
  const newSolvesCount = user.solvesCount + 1;
  const newBreakdown = {
    ...user.categoryBreakdown,
    [challenge.category]: (user.categoryBreakdown[challenge.category] || 0) + challenge.points
  };

  const isFirstBlood = challenge.solvesCount === 0;

  try {
    // 1. Update user profile in Firestore
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      solvedChallengeIds: newSolved,
      score: newScore,
      solvesCount: newSolvesCount,
      categoryBreakdown: newBreakdown,
      lastSolveTime: 'Just now',
      updatedAt: new Date().toISOString()
    });

    // 2. Increment challenge solvesCount
    const challengeRef = doc(db, CHALLENGES_COLLECTION, challenge.id);
    await updateDoc(challengeRef, {
      solvesCount: increment(1),
      updatedAt: new Date().toISOString()
    });

    // 3. Broadcast live activity event
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId: user.uid,
      teamName: user.username,
      challengeTitle: challenge.title,
      category: challenge.category,
      points: challenge.points,
      timestamp: 'Just now',
      isFirstBlood,
      isUser: true
    };
    await addDoc(activityCol, activityEvent);

    return {
      success: true,
      message: `Flag Captured! +${challenge.points} points awarded.`
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
