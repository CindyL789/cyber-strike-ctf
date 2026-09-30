import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Challenge, DailyOpInfo } from '../types/ctf';
import { INITIAL_CHALLENGES } from '../data/challenges';

const DAILY_OPS_COLLECTION = 'daily_ops';

export async function ensureDailyChallengePublished(): Promise<string> {
  const todayStr = new Date().toISOString().split('T')[0];
  const docRef = doc(db, DAILY_OPS_COLLECTION, todayStr);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      // Deterministically pick today's challenge from hard challenges
      const hardChallenges = INITIAL_CHALLENGES.filter(c => c.difficulty === 'Hard' || c.difficulty === 'Insane');
      const dayNum = new Date().getDate();
      const selected = hardChallenges[dayNum % hardChallenges.length] || INITIAL_CHALLENGES[0];

      await setDoc(docRef, {
        date: todayStr,
        challengeId: selected.id,
        bonusPoints: 100,
        publishedAt: new Date().toISOString()
      });
      return selected.id;
    }
    return snap.data().challengeId;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${DAILY_OPS_COLLECTION}/${todayStr}`);
    return INITIAL_CHALLENGES[0].id;
  }
}

export function getDailyOpInfo(challenges: Challenge[] | undefined, solvedIds: string[] = []): DailyOpInfo {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];

  // End of UTC day
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);
  const diffMs = Math.max(0, endOfDay.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const source = (challenges && challenges.length > 0) ? challenges : INITIAL_CHALLENGES;
  const hardChallenges = source.filter(c => c.difficulty === 'Hard' || c.difficulty === 'Insane' || c.difficulty === 'Nightmare');
  const pool = hardChallenges.length > 0 ? hardChallenges : source;
  const dayNum = now.getDate();
  const challenge = (pool.length > 0 ? pool[dayNum % pool.length] : null) || source[0] || INITIAL_CHALLENGES[0];

  const challengeId = challenge ? challenge.id : INITIAL_CHALLENGES[0].id;
  const targetChallenge = challenge || INITIAL_CHALLENGES[0];

  return {
    challengeId,
    challenge: targetChallenge,
    date: todayStr,
    dayName,
    bonusPoints: 100,
    timeRemaining: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    secondsRemaining: Math.floor(diffMs / 1000),
    isSolvedToday: solvedIds.includes(challengeId),
    totalDailyAvailable: pool.length
  };
}
