import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, UserRole, Category } from '../types/ctf';

const ADMIN_EMAIL = 'cindylouis2228@gmail.com';

function getRoleForUser(email: string | null | undefined): UserRole {
  return email === ADMIN_EMAIL ? 'admin' : 'player';
}

function cleanUsername(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
}

export function formatAuthEmail(identifier: string): string {
  if (identifier.includes('@')) {
    return identifier.trim().toLowerCase();
  }
  const sanitized = cleanUsername(identifier).toLowerCase();
  return `${sanitized || 'player'}@ctf-arena.local`;
}

export async function registerPlayer(
  usernameInput: string,
  passwordInput: string,
  emailInput?: string
): Promise<UserProfile> {
  const username = cleanUsername(usernameInput);
  if (username.length < 2) {
    throw new Error('Username must be at least 2 alphanumeric characters.');
  }
  if (passwordInput.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const emailToUse = emailInput && emailInput.includes('@')
    ? emailInput.trim().toLowerCase()
    : formatAuthEmail(username);

  try {
    const cred = await createUserWithEmailAndPassword(auth, emailToUse, passwordInput);
    const user = cred.user;

    await updateProfile(user, { displayName: username });

    const role = getRoleForUser(user.email || emailToUse);

    const defaultProfile: UserProfile = {
      uid: user.uid,
      username: username,
      email: user.email || emailToUse,
      score: 0,
      solvesCount: 0,
      solvedChallengeIds: [],
      unlockedHintIds: [],
      categoryBreakdown: {
        Web: 0,
        Crypto: 0,
        Reverse: 0,
        Forensics: 0,
        Pwn: 0
      },
      role,
      lastSolveTime: 'Never',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, defaultProfile);

    // If admin, also store in /admins collection
    if (role === 'admin') {
      try {
        await setDoc(doc(db, 'admins', user.uid), {
          email: defaultProfile.email,
          username: defaultProfile.username,
          assignedAt: new Date().toISOString()
        });
      } catch {
        // Continue if admin collection already initialized or handled by rule
      }
    }

    return defaultProfile;
  } catch (err: unknown) {
    const errObj = err as { code?: string; message?: string };
    if (errObj.code === 'auth/email-already-in-use') {
      throw new Error('Username or email is already registered. Try logging in.');
    }
    if (errObj.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use at least 6 characters.');
    }
    throw new Error(errObj.message || 'Registration failed.');
  }
}

export async function loginPlayer(identifier: string, passwordInput: string): Promise<UserProfile> {
  const emailToUse = formatAuthEmail(identifier);
  try {
    const cred = await signInWithEmailAndPassword(auth, emailToUse, passwordInput);
    const user = cred.user;

    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    } else {
      // Re-create profile if missing
      const username = user.displayName || identifier.split('@')[0];
      const role = getRoleForUser(user.email || emailToUse);

      const newProfile: UserProfile = {
        uid: user.uid,
        username,
        email: user.email || emailToUse,
        score: 0,
        solvesCount: 0,
        solvedChallengeIds: [],
        unlockedHintIds: [],
        categoryBreakdown: { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 },
        role,
        lastSolveTime: 'Never',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  } catch (err: unknown) {
    const errObj = err as { code?: string; message?: string };
    if (
      errObj.code === 'auth/user-not-found' ||
      errObj.code === 'auth/wrong-password' ||
      errObj.code === 'auth/invalid-credential'
    ) {
      throw new Error('Invalid username/email or password.');
    }
    throw new Error(errObj.message || 'Login failed.');
  }
}

export async function loginWithGoogle(): Promise<UserProfile> {
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    } else {
      const username = user.displayName?.replace(/\s+/g, '_') || user.email?.split('@')[0] || 'Operator';
      const role = getRoleForUser(user.email);

      const newProfile: UserProfile = {
        uid: user.uid,
        username,
        email: user.email || '',
        score: 0,
        solvesCount: 0,
        solvedChallengeIds: [],
        unlockedHintIds: [],
        categoryBreakdown: { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 },
        role,
        lastSolveTime: 'Never',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, newProfile);

      if (role === 'admin') {
        try {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            username,
            assignedAt: new Date().toISOString()
          });
        } catch {
          // Ignore
        }
      }

      return newProfile;
    }
  } catch (err: unknown) {
    throw new Error((err as Error).message || 'Google sign-in failed.');
  }
}

export async function logoutPlayer(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthProfile(
  onProfile: (profile: UserProfile | null) => void
): () => void {
  let unsubscribeDoc: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, user => {
    if (unsubscribeDoc) {
      unsubscribeDoc();
      unsubscribeDoc = null;
    }

    if (!user) {
      onProfile(null);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    unsubscribeDoc = onSnapshot(
      docRef,
      snap => {
        if (snap.exists()) {
          onProfile(snap.data() as UserProfile);
        } else {
          // Default profile if not yet written
          const username = user.displayName || user.email?.split('@')[0] || 'GuestOperator';
          const role = getRoleForUser(user.email);

          const stub: UserProfile = {
            uid: user.uid,
            username,
            email: user.email || '',
            score: 0,
            solvesCount: 0,
            solvedChallengeIds: [],
            unlockedHintIds: [],
            categoryBreakdown: { Web: 0, Crypto: 0, Reverse: 0, Forensics: 0, Pwn: 0 },
            role,
            lastSolveTime: 'Never',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onProfile(stub);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeDoc) unsubscribeDoc();
  };
}
