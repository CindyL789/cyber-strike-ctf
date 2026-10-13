import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, handleFirestoreError, OperationType } from '../firebase/config';
import { Challenge, ActivityEvent, UserProfile } from '../types/ctf';
import { INITIAL_CHALLENGES } from '../data/challenges';

const CHALLENGES_COLLECTION = 'challenges';
const ACTIVITY_COLLECTION = 'activity';
const USERS_COLLECTION = 'users';

export function subscribeToChallenges(callback: (challenges: Challenge[]) => void) {
  const challengesRef = collection(db, CHALLENGES_COLLECTION);
  return onSnapshot(
    challengesRef,
    snapshot => {
      if (snapshot.empty) {
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
  candidateFlag: string
): Promise<{ success: boolean; earnedPoints: number; message: string }> {
  try {
    const call = httpsCallable<
      { challengeId?: string; flag: string },
      { success: boolean; earnedPoints: number; message: string }
    >(functions, 'submitFlag');
    const result = await call({ challengeId: challenge.id || undefined, flag: candidateFlag.trim() });
    return result.data;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

export async function submitFlagByValue(
  candidateFlag: string
): Promise<{ success: boolean; earnedPoints: number; message: string }> {
  const call = httpsCallable<
    { flag: string },
    { success: boolean; earnedPoints: number; message: string }
  >(functions, 'submitFlag');
  const result = await call({ flag: candidateFlag.trim() });
  return result.data;
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
