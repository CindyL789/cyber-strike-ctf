import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile } from '../types/ctf';

const USERS_COLLECTION = 'users';
const TEAMS_COLLECTION = 'teams';

export function subscribeToAuthProfile(callback: (profile: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async user => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const userRef = doc(db, USERS_COLLECTION, user.uid);
      const unsubDoc = onSnapshot(userRef, snap => {
        if (snap.exists()) {
          callback(snap.data() as UserProfile);
        } else {
          // Profile doc pending initialization
          callback(null);
        }
      });
      return () => unsubDoc();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${USERS_COLLECTION}/${user.uid}`);
      callback(null);
    }
  });
}

export async function registerPlayer(email: string, pass: string, username: string): Promise<UserProfile> {
  const cleanEmail = email.trim();
  const cleanUser = username.trim();

  // Enforce unique username check
  const q = query(collection(db, USERS_COLLECTION), where('username', '==', cleanUser));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Username "${cleanUser}" is already taken by another operative.`);
  }

  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  const uid = userCredential.user.uid;
  const isBootstrapAdmin = cleanEmail.toLowerCase() === 'cindylouis2228@gmail.com';

  const newProfile: UserProfile = {
    uid,
    username: cleanUser,
    email: cleanEmail,
    score: 0,
    solvesCount: 0,
    solvedChallengeIds: [],
    unlockedHintIds: [],
    tokens: 250, // 250 starting credits
    categoryBreakdown: {
      Web: 0,
      Crypto: 0,
      Reverse: 0,
      Forensics: 0,
      Pwn: 0
    },
    role: isBootstrapAdmin ? 'admin' : 'player',
    dailyStreak: 0,
    dailySolvesCount: 0,
    inventory: [],
    hasRadarLicense: false,
    tokenBoosterCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), newProfile);
    return newProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${USERS_COLLECTION}/${uid}`);
    throw err;
  }
}

export async function loginPlayer(email: string, pass: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), pass);
}

export async function logoutPlayer(): Promise<void> {
  await signOut(auth);
}

export async function createTeam(user: UserProfile, teamName: string, teamTag: string): Promise<string> {
  const cleanName = teamName.trim();
  const cleanTag = teamTag.trim().toUpperCase();

  const q = query(collection(db, TEAMS_COLLECTION), where('name', '==', cleanName));
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error(`Squad name "${cleanName}" is already registered.`);
  }

  const teamRef = doc(collection(db, TEAMS_COLLECTION));
  const newTeam = {
    id: teamRef.id,
    name: cleanName,
    avatar: cleanName.substring(0, 2).toUpperCase(),
    teamTag: cleanTag,
    captainId: user.uid,
    memberIds: [user.uid],
    memberCount: 1,
    score: user.score,
    solves: user.solvesCount,
    lastSolveTime: user.lastSolveTime || 'Just now',
    categoryBreakdown: user.categoryBreakdown,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(teamRef, newTeam);
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      teamId: teamRef.id,
      teamName: cleanName,
      teamTag: cleanTag,
      isCaptain: true,
      updatedAt: new Date().toISOString()
    });
    return teamRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${TEAMS_COLLECTION}/${teamRef.id}`);
    throw err;
  }
}

export async function joinTeam(user: UserProfile, teamId: string): Promise<void> {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) {
    throw new Error('Squad not found.');
  }

  const data = snap.data();
  const memberIds: string[] = data.memberIds || [];
  if (memberIds.includes(user.uid)) {
    return;
  }

  memberIds.push(user.uid);
  try {
    await updateDoc(teamRef, {
      memberIds,
      memberCount: memberIds.length,
      updatedAt: new Date().toISOString()
    });

    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      teamId,
      teamName: data.name,
      teamTag: data.teamTag,
      isCaptain: false,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${TEAMS_COLLECTION}/${teamId}`);
    throw err;
  }
}
