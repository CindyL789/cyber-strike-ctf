import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  addDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Team, UserProfile, Challenge, Category, ActivityEvent } from '../types/ctf';

const TEAMS_COLLECTION = 'teams';
const USERS_COLLECTION = 'users';
const ACTIVITY_COLLECTION = 'activity';

// Helper to generate a clean, shareable invite code like "SQUAD-7X9B2"
export function generateInviteCode(tag: string): string {
  const cleanTag = tag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'CTF';
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${cleanTag}-${randomChars}`;
}

// Compute aggregate metrics from a list of challenge IDs
export function calculateAggregatedMetrics(
  solvedChallengeIds: string[],
  allChallenges: Challenge[]
): { score: number; solvesCount: number; categoryBreakdown: Record<Category, number> } {
  const uniqueIds = Array.from(new Set(solvedChallengeIds));
  const challengeMap = new Map(allChallenges.map(c => [c.id, c]));

  let score = 0;
  const categoryBreakdown: Record<Category, number> = {
    Web: 0,
    Crypto: 0,
    Reverse: 0,
    Forensics: 0,
    Pwn: 0
  };

  uniqueIds.forEach(id => {
    const ch = challengeMap.get(id);
    if (ch) {
      score += ch.points;
      categoryBreakdown[ch.category] = (categoryBreakdown[ch.category] || 0) + ch.points;
    }
  });

  return {
    score,
    solvesCount: uniqueIds.length,
    categoryBreakdown
  };
}

// 1. Create a new Team
export async function createTeam(
  user: UserProfile,
  name: string,
  tag: string,
  description: string,
  isOpen: boolean,
  allChallenges: Challenge[]
): Promise<Team> {
  const cleanName = name.trim();
  const cleanTag = tag.trim().toUpperCase();

  if (!cleanName || cleanName.length < 2) {
    throw new Error('Team name must be at least 2 characters.');
  }
  if (!cleanTag || cleanTag.length < 2 || cleanTag.length > 6) {
    throw new Error('Team tag must be between 2 and 6 alphanumeric characters.');
  }

  const teamId = `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const inviteCode = generateInviteCode(cleanTag);

  // Initial combined solves from captain's progress
  const metrics = calculateAggregatedMetrics(user.solvedChallengeIds || [], allChallenges);

  const teamData: Team = {
    id: teamId,
    name: cleanName,
    tag: cleanTag,
    description: description.trim() || 'A competitive CTF collective.',
    captainId: user.uid,
    captainName: user.username,
    memberIds: [user.uid],
    inviteCode,
    score: metrics.score,
    solvesCount: metrics.solvesCount,
    solvedChallengeIds: Array.from(new Set(user.solvedChallengeIds || [])),
    categoryBreakdown: metrics.categoryBreakdown,
    isOpen: !!isOpen,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    // Write Team Document
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    await setDoc(teamRef, teamData);

    // Update Captain's User Profile
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      teamId: teamId,
      teamName: cleanName,
      teamTag: cleanTag,
      isCaptain: true,
      updatedAt: new Date().toISOString()
    });

    // Broadcast Activity Event
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId: user.uid,
      teamName: `[${cleanTag}] ${cleanName}`,
      challengeTitle: `Founded Team [${cleanTag}]`,
      category: 'Web',
      points: metrics.score,
      timestamp: 'Just now',
      isUser: true
    };
    await addDoc(activityCol, activityEvent);

    return teamData;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${TEAMS_COLLECTION}/${teamId}`);
    throw err;
  }
}

// 2. Join a Team via Invitation Code
export async function joinTeamByInviteCode(
  user: UserProfile,
  rawInviteCode: string,
  allChallenges: Challenge[]
): Promise<Team> {
  const code = rawInviteCode.trim().toUpperCase();
  if (!code) {
    throw new Error('Please enter a valid team invitation code.');
  }

  try {
    const teamsCol = collection(db, TEAMS_COLLECTION);
    const q = query(teamsCol, where('inviteCode', '==', code));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error(`No team found with invitation code "${code}". Please verify the code.`);
    }

    const teamDoc = snap.docs[0];
    const team = { ...teamDoc.data(), id: teamDoc.id } as Team;

    if (team.memberIds.includes(user.uid)) {
      throw new Error(`You are already a member of ${team.name}.`);
    }

    // Combine solved challenges from existing team + joining user
    const combinedSolvedIds = Array.from(new Set([...team.solvedChallengeIds, ...(user.solvedChallengeIds || [])]));
    const metrics = calculateAggregatedMetrics(combinedSolvedIds, allChallenges);

    const updatedMemberIds = [...team.memberIds, user.uid];

    // Update Team Document
    await updateDoc(doc(db, TEAMS_COLLECTION, team.id), {
      memberIds: updatedMemberIds,
      solvedChallengeIds: combinedSolvedIds,
      score: metrics.score,
      solvesCount: metrics.solvesCount,
      categoryBreakdown: metrics.categoryBreakdown,
      updatedAt: new Date().toISOString()
    });

    // Update User Profile
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      isCaptain: false,
      updatedAt: new Date().toISOString()
    });

    // Broadcast Join Event in Activity
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    await addDoc(activityCol, {
      userId: user.uid,
      teamName: `[${team.tag}] ${team.name}`,
      challengeTitle: `${user.username} joined the squad!`,
      category: 'Web',
      points: metrics.score,
      timestamp: 'Just now',
      isUser: true
    });

    return {
      ...team,
      memberIds: updatedMemberIds,
      solvedChallengeIds: combinedSolvedIds,
      score: metrics.score,
      solvesCount: metrics.solvesCount,
      categoryBreakdown: metrics.categoryBreakdown
    };
  } catch (err) {
    if (err instanceof Error && !err.message.includes('permission')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/join`);
    throw err;
  }
}

// 3. Join a Public Open Team
export async function joinPublicTeam(
  user: UserProfile,
  teamId: string,
  allChallenges: Challenge[]
): Promise<Team> {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const snap = await getDoc(teamRef);

  if (!snap.exists()) {
    throw new Error('Team does not exist or was disbanded.');
  }

  const team = { ...snap.data(), id: snap.id } as Team;

  if (team.memberIds.includes(user.uid)) {
    throw new Error(`You are already a member of ${team.name}.`);
  }

  const combinedSolvedIds = Array.from(new Set([...team.solvedChallengeIds, ...(user.solvedChallengeIds || [])]));
  const metrics = calculateAggregatedMetrics(combinedSolvedIds, allChallenges);
  const updatedMemberIds = [...team.memberIds, user.uid];

  try {
    await updateDoc(teamRef, {
      memberIds: updatedMemberIds,
      solvedChallengeIds: combinedSolvedIds,
      score: metrics.score,
      solvesCount: metrics.solvesCount,
      categoryBreakdown: metrics.categoryBreakdown,
      updatedAt: new Date().toISOString()
    });

    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      teamId: team.id,
      teamName: team.name,
      teamTag: team.tag,
      isCaptain: false,
      updatedAt: new Date().toISOString()
    });

    return {
      ...team,
      memberIds: updatedMemberIds,
      solvedChallengeIds: combinedSolvedIds,
      score: metrics.score,
      solvesCount: metrics.solvesCount,
      categoryBreakdown: metrics.categoryBreakdown
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/${teamId}`);
    throw err;
  }
}

// 4. Leave Team / Disband
export async function leaveTeam(
  user: UserProfile,
  team: Team,
  allMembers: UserProfile[],
  allChallenges: Challenge[]
): Promise<void> {
  const teamRef = doc(db, TEAMS_COLLECTION, team.id);
  const userRef = doc(db, USERS_COLLECTION, user.uid);

  try {
    const remainingMemberIds = team.memberIds.filter(id => id !== user.uid);

    if (remainingMemberIds.length === 0) {
      // Disband team if last member leaves
      await deleteDoc(teamRef);
    } else {
      // Recompute team solved challenges and score from remaining members
      const remainingMembers = allMembers.filter(m => remainingMemberIds.includes(m.uid));
      const remainingSolved: string[] = [];
      remainingMembers.forEach(m => {
        if (m.solvedChallengeIds) {
          remainingSolved.push(...m.solvedChallengeIds);
        }
      });

      const metrics = calculateAggregatedMetrics(remainingSolved, allChallenges);
      const isCaptainLeaving = team.captainId === user.uid;
      const newCaptainId = isCaptainLeaving ? remainingMemberIds[0] : team.captainId;
      const newCaptainObj = remainingMembers.find(m => m.uid === newCaptainId);
      const newCaptainName = newCaptainObj ? newCaptainObj.username : team.captainName;

      await updateDoc(teamRef, {
        memberIds: remainingMemberIds,
        captainId: newCaptainId,
        captainName: newCaptainName,
        solvedChallengeIds: Array.from(new Set(remainingSolved)),
        score: metrics.score,
        solvesCount: metrics.solvesCount,
        categoryBreakdown: metrics.categoryBreakdown,
        updatedAt: new Date().toISOString()
      });

      if (isCaptainLeaving && newCaptainId) {
        await updateDoc(doc(db, USERS_COLLECTION, newCaptainId), {
          isCaptain: true,
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Reset user profile team membership
    await updateDoc(userRef, {
      teamId: null,
      teamName: null,
      teamTag: null,
      isCaptain: false,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/${team.id}`);
    throw err;
  }
}

// 5. Regenerate Invitation Code (Captain only)
export async function regenerateInviteCode(
  teamId: string,
  tag: string
): Promise<string> {
  const newCode = generateInviteCode(tag);
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);

  try {
    await updateDoc(teamRef, {
      inviteCode: newCode,
      updatedAt: new Date().toISOString()
    });
    return newCode;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/${teamId}`);
    throw err;
  }
}

// 6. Update Team Settings (Captain only)
export async function updateTeamSettings(
  teamId: string,
  settings: { name?: string; tag?: string; description?: string; isOpen?: boolean }
): Promise<void> {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);

  try {
    await updateDoc(teamRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/${teamId}`);
    throw err;
  }
}

// 7. Subscribe to a specific Team
export function subscribeToTeam(
  teamId: string | null | undefined,
  onUpdate: (team: Team | null) => void
): () => void {
  if (!teamId) {
    onUpdate(null);
    return () => {};
  }

  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const unsubscribe = onSnapshot(
    teamRef,
    snap => {
      if (snap.exists()) {
        onUpdate({ ...snap.data(), id: snap.id } as Team);
      } else {
        onUpdate(null);
      }
    },
    error => {
      handleFirestoreError(error, OperationType.GET, `${TEAMS_COLLECTION}/${teamId}`);
      onUpdate(null);
    }
  );

  return unsubscribe;
}

// 8. Subscribe to all Teams (for Team Directory & Leaderboard)
export function subscribeToAllTeams(
  onUpdate: (teams: Team[]) => void
): () => void {
  const teamsCol = collection(db, TEAMS_COLLECTION);
  const unsubscribe = onSnapshot(
    teamsCol,
    snap => {
      const list: Team[] = [];
      snap.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Team);
      });
      // Sort highest score first
      list.sort((a, b) => b.score - a.score);
      onUpdate(list);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, TEAMS_COLLECTION);
      onUpdate([]);
    }
  );

  return unsubscribe;
}

// 9. Sync challenge solve to team progress
export async function syncSolveToTeam(
  teamId: string,
  challenge: Challenge
): Promise<void> {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  try {
    const snap = await getDoc(teamRef);
    if (!snap.exists()) return;

    const team = snap.data() as Team;
    if (team.solvedChallengeIds && team.solvedChallengeIds.includes(challenge.id)) {
      // Challenge was already solved by another member
      return;
    }

    const updatedSolved = [...(team.solvedChallengeIds || []), challenge.id];
    const newScore = (team.score || 0) + challenge.points;
    const newSolvesCount = (team.solvesCount || 0) + 1;
    const newBreakdown = {
      ...(team.categoryBreakdown || { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 }),
      [challenge.category]: (team.categoryBreakdown?.[challenge.category] || 0) + challenge.points
    };

    await updateDoc(teamRef, {
      solvedChallengeIds: updatedSolved,
      score: newScore,
      solvesCount: newSolvesCount,
      categoryBreakdown: newBreakdown,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to sync solve to team document:', err);
  }
}
