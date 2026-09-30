import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { TeamScore } from '../types/ctf';
import { INITIAL_TEAMS } from '../data/challenges';

const USERS_COLLECTION = 'users';

export function subscribeToScoreboard(callback: (teams: TeamScore[]) => void) {
  const usersRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    usersRef,
    snapshot => {
      if (snapshot.empty) {
        callback(INITIAL_TEAMS);
        return;
      }

      const list: TeamScore[] = [];
      snapshot.forEach(docSnap => {
        const u = docSnap.data();
        list.push({
          id: docSnap.id,
          name: u.username || 'Anonymous Operative',
          avatar: (u.username || 'OP').substring(0, 2).toUpperCase(),
          score: u.score || 0,
          solves: u.solvesCount || 0,
          lastSolveTime: u.lastSolveTime || 'None',
          categoryBreakdown: u.categoryBreakdown || { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 },
          teamTag: u.teamTag,
          badgeTitle: u.badgeTitle
        });
      });

      // Merge with initial bot teams for a lively competition
      INITIAL_TEAMS.forEach(bot => {
        if (!list.some(l => l.name === bot.name)) {
          list.push(bot);
        }
      });

      list.sort((a, b) => b.score - a.score);
      callback(list);
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, USERS_COLLECTION);
      callback(INITIAL_TEAMS);
    }
  );
}
