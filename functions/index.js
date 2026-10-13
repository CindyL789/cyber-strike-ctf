const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const db = getFirestore();
const challengeSecrets = defineSecret('CTF_CHALLENGE_SECRETS');
const categories = new Set(['Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn']);

exports.submitFlag = onCall({ secrets: [challengeSecrets] }, async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to submit a competitive flag.');
  }

  const candidate = typeof request.data?.flag === 'string' ? request.data.flag.trim().toLowerCase() : '';
  const requestedId = typeof request.data?.challengeId === 'string' ? request.data.challengeId : '';
  if (!candidate || candidate.length > 256 || requestedId.length > 128) {
    throw new HttpsError('invalid-argument', 'Submit a valid flag and challenge.');
  }

  let secrets;
  try {
    secrets = JSON.parse(challengeSecrets.value());
  } catch {
    throw new HttpsError('failed-precondition', 'Challenge answer service is not configured.');
  }
  if (!secrets || typeof secrets !== 'object' || Array.isArray(secrets)) {
    throw new HttpsError('failed-precondition', 'Challenge answer service is not configured.');
  }

  const match = requestedId
    ? [requestedId, secrets[requestedId]]
    : Object.entries(secrets).find(([, value]) => value?.flag?.toLowerCase() === candidate);
  const [challengeId, challenge] = match || [];
  if (
    !challenge
    || typeof challenge.flag !== 'string'
    || challenge.flag.toLowerCase() !== candidate
  ) {
    return { success: false, earnedPoints: 0, message: 'Incorrect flag.' };
  }
  if (!Number.isInteger(challenge.points) || challenge.points < 1 || !categories.has(challenge.category)) {
    throw new HttpsError('failed-precondition', 'Challenge scoring configuration is invalid.');
  }

  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const activityRef = db.collection('activity').doc();
  const now = new Date().toISOString();

  return db.runTransaction(async transaction => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError('failed-precondition', 'Player profile is not initialized.');
    }

    const profile = userSnap.data();
    const solvedIds = profile.solvedChallengeIds || [];
    if (solvedIds.includes(challengeId)) {
      return { success: true, earnedPoints: 0, message: 'Challenge already solved!' };
    }

    const teamId = profile.teamId;
    const teamRef = typeof teamId === 'string' && teamId ? db.collection('teams').doc(teamId) : null;
    const teamSnap = teamRef ? await transaction.get(teamRef) : null;
    const team = teamSnap?.data();
    const categoryBreakdown = { ...(profile.categoryBreakdown || {}) };
    categoryBreakdown[challenge.category] = (categoryBreakdown[challenge.category] || 0) + challenge.points;

    transaction.update(userRef, {
      solvedChallengeIds: [...solvedIds, challengeId],
      score: (profile.score || 0) + challenge.points,
      solvesCount: (profile.solvesCount || 0) + 1,
      categoryBreakdown,
      tokens: (profile.tokens ?? 250) + 50,
      lastSolveTime: now,
      updatedAt: now
    });
    transaction.set(activityRef, {
      userId: uid,
      teamName: profile.teamName || profile.username,
      challengeTitle: challengeId,
      category: challenge.category,
      points: challenge.points,
      timestamp: now,
      isFirstBlood: false
    });

    if (teamRef && teamSnap?.exists && (team.memberIds || []).includes(uid)) {
      const teamSolvedIds = team.solvedChallengeIds || [];
      if (!teamSolvedIds.includes(challengeId)) {
        transaction.update(teamRef, {
          solvedChallengeIds: [...teamSolvedIds, challengeId],
          score: (team.score || 0) + challenge.points,
          solvesCount: (team.solvesCount || 0) + 1,
          updatedAt: now
        });
      }
    }
    return { success: true, earnedPoints: challenge.points, message: `Flag captured! +${challenge.points} points awarded.` };
  });
});
