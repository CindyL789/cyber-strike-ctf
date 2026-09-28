import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, Team, TeamScore, Category } from '../types/ctf';
import { INITIAL_TEAMS } from '../data/challenges';

const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';

export function subscribeToScoreboard(
  currentUserId: string | null,
  onUpdate: (rankings: TeamScore[]) => void
): () => void {
  const usersRef = collection(db, USERS_COLLECTION);
  const teamsRef = collection(db, TEAMS_COLLECTION);

  let currentUsers: UserProfile[] = [];
  let currentTeams: Team[] = [];

  const compileLeaderboard = () => {
    const list: TeamScore[] = [];

    // 1. Add created Teams with aggregated scores & solved challenges
    currentTeams.forEach(t => {
      const isUserTeam = currentUserId ? (t.memberIds || []).includes(currentUserId) : false;
      const initials = (t.tag || t.name.slice(0, 3)).toUpperCase();

      list.push({
        id: t.id,
        name: t.name,
        teamTag: t.tag,
        avatar: initials,
        score: t.score || 0,
        solves: t.solvesCount || 0,
        lastSolveTime: 'Active',
        categoryBreakdown: t.categoryBreakdown || {
          Web: 0,
          Crypto: 0,
          Reverse: 0,
          Forensics: 0,
          Pwn: 0
        },
        isTeam: true,
        memberCount: (t.memberIds || []).length,
        captainName: t.captainName,
        isUser: isUserTeam
      });
    });

    // 2. Add solo players (users who have NOT joined any team)
    const usersInTeams = new Set<string>();
    currentTeams.forEach(t => {
      (t.memberIds || []).forEach(uid => usersInTeams.add(uid));
    });

    currentUsers.forEach(u => {
      // If user is already in a team, their score is aggregated into the team entry
      if (usersInTeams.has(u.uid) || u.teamId) return;

      const initials = (u.username || 'OP').slice(0, 2).toUpperCase();
      list.push({
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
        isTeam: false,
        memberCount: 1,
        isUser: currentUserId ? u.uid === currentUserId : false
      });
    });

    // 3. Add static benchmark competitor teams
    const existingNames = new Set(list.map(item => item.name.toLowerCase()));
    const staticBenchmarkTeams = INITIAL_TEAMS.filter(
      t => !t.isUser && !existingNames.has(t.name.toLowerCase())
    ).map(t => ({
      ...t,
      isTeam: true,
      memberCount: 3
    }));

    const combined = [...list, ...staticBenchmarkTeams];
    combined.sort((a, b) => b.score - a.score);

    onUpdate(combined);
  };

  const unsubUsers = onSnapshot(
    usersRef,
    snap => {
      const users: UserProfile[] = [];
      snap.forEach(d => {
        users.push({ ...d.data(), uid: d.id } as UserProfile);
      });
      currentUsers = users;
      compileLeaderboard();
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, USERS_COLLECTION);
    }
  );

  const unsubTeams = onSnapshot(
    teamsRef,
    snap => {
      const teams: Team[] = [];
      snap.forEach(d => {
        teams.push({ ...d.data(), id: d.id } as Team);
      });
      currentTeams = teams;
      compileLeaderboard();
    },
    err => {
      handleFirestoreError(err, OperationType.LIST, TEAMS_COLLECTION);
    }
  );

  return () => {
    unsubUsers();
    unsubTeams();
  };
}
