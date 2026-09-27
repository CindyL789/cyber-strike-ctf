import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, TeamScore, Category } from '../types/ctf';
import { INITIAL_TEAMS } from '../data/challenges';

const USERS_COLLECTION = 'users';

export function subscribeToScoreboard(
  currentUserId: string | null,
  onUpdate: (teams: TeamScore[]) => void
): () => void {
  const colRef = collection(db, USERS_COLLECTION);

  const unsubscribe = onSnapshot(
    colRef,
    snapshot => {
      const livePlayers: TeamScore[] = [];

      snapshot.forEach(docSnap => {
        const u = docSnap.data() as UserProfile;
        const initials = (u.username || 'OP')
          .slice(0, 2)
          .toUpperCase();

        livePlayers.push({
          id: u.uid,
          name: u.username || 'Anonymous',
          avatar: initials,
          score: u.score || 0,
          solves: u.solvesCount || 0,
          lastSolveTime: u.lastSolveTime || 'N/A',
          categoryBreakdown: u.categoryBreakdown || {
            Web: 0,
            Crypto: 0,
            Reverse: 0,
            Forensics: 0,
            Pwn: 0
          },
          isUser: currentUserId ? u.uid === currentUserId : false
        });
      });

      // Filter out INITIAL_TEAMS that match live player names to avoid duplication
      const existingNames = new Set(livePlayers.map(p => p.name.toLowerCase()));
      const staticBenchmarkTeams = INITIAL_TEAMS.filter(
        t => !t.isUser && !existingNames.has(t.name.toLowerCase())
      );

      // Combine real players with benchmark teams, and sort descending by score
      const combined = [...livePlayers, ...staticBenchmarkTeams];
      combined.sort((a, b) => b.score - a.score);

      onUpdate(combined);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, USERS_COLLECTION);
      onUpdate(INITIAL_TEAMS);
    }
  );

  return unsubscribe;
}
