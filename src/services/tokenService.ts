import { doc, updateDoc, collection, addDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile, TokenPackage, Top5RewardTier, ActivityEvent, ArmoryItem } from '../types/ctf';

const USERS_COLLECTION = 'users';
const ACTIVITY_COLLECTION = 'activity';

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'recon-pack',
    name: 'Reconnaissance Scout',
    tokens: 250,
    bonusTokens: 0,
    priceUsd: 4.99,
    tier: 'Recon',
    badge: '🛰️ Recon',
    perks: [
      'Unlock 5-8 Hints with 0 Score Penalty',
      'Basic Target Recon Analysis scan',
      'Instant cyber credit delivery'
    ]
  },
  {
    id: 'tactical-arsenal',
    name: 'Special Ops Tactical',
    tokens: 750,
    bonusTokens: 150,
    priceUsd: 9.99,
    popular: true,
    tier: 'Tactical',
    badge: '⚡ Tactical',
    perks: [
      '900 Total Cyber Credits (+150 Bonus)',
      'Unlock 15-20 Strategic Hints penalty-free',
      'Full Target Vulnerability Diagnostics',
      'Tactical Operator Accent Frame'
    ]
  },
  {
    id: 'blackhat-syndicate',
    name: 'Black Hat Syndicate',
    tokens: 2200,
    bonusTokens: 500,
    priceUsd: 19.99,
    tier: 'BlackHat',
    badge: '💀 Syndicate',
    perks: [
      '2,700 Total Cyber Credits (+500 Bonus)',
      'Team Hint Sharing & Co-op Scans',
      'Priority Cyber Workbench Diagnostics',
      'VIP Syndicate Badge on Leaderboard'
    ]
  },
  {
    id: 'zero-day-sovereign',
    name: 'Zero-Day Sovereign Vault',
    tokens: 6000,
    bonusTokens: 2000,
    priceUsd: 49.99,
    tier: 'Syndicate',
    badge: '👑 Sovereign',
    perks: [
      'Massive 8,000 Total Cyber Credits (+2,000 Bonus)',
      'Unlimited Target Architecture Scans',
      'Permanent Sovereign Title & Holographic Crown',
      'Lifetime CTF Armory Privileges'
    ]
  }
];

export const TOP_5_REWARDS: Top5RewardTier[] = [
  {
    rank: 1,
    title: 'Null Byte Emperor',
    tokensReward: 5000,
    badge: '👑 Obsidian Crown',
    frameColor: 'border-amber-400 text-amber-300 shadow-amber-500/20 bg-amber-950/40',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    summary: 'The supreme architect of the cyber matrix. Champion of the CTF Arena.',
    perks: [
      '5,000 Cyber Credits instantly granted',
      'Exclusive Obsidian Emperor Crown Insignia',
      'Permanent Golden Holographic Leaderboard Frame',
      'CTF Hall of Fame Induction'
    ]
  },
  {
    rank: 2,
    title: 'Root Archon',
    tokensReward: 3500,
    badge: '⚡ Crimson Skull',
    frameColor: 'border-rose-500 text-rose-300 shadow-rose-500/20 bg-rose-950/40',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    summary: 'Master of kernel exploitation and ruthless adversary evasion.',
    perks: [
      '3,500 Cyber Credits instantly granted',
      'Crimson Skull Vanguard Badge',
      'Ruby Leaderboard Profile Glow',
      'Silver Podium Citation'
    ]
  },
  {
    rank: 3,
    title: 'Cipher Vanguard',
    tokensReward: 2200,
    badge: '🛡️ Emerald Dragon',
    frameColor: 'border-emerald-500 text-emerald-300 shadow-emerald-500/20 bg-emerald-950/40',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    summary: 'Cryptographic virtuoso capable of shattering advanced lattice and stream ciphers.',
    perks: [
      '2,200 Cyber Credits instantly granted',
      'Emerald Dragon Insignia',
      'Emerald Leaderboard Profile Glow',
      'Bronze Podium Citation'
    ]
  },
  {
    rank: 4,
    title: 'Shadow Operative',
    tokensReward: 1400,
    badge: '⚔️ Cobalt Aegis',
    frameColor: 'border-blue-500 text-blue-300 shadow-blue-500/20 bg-blue-950/40',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    summary: 'Stealth memory investigator and relentless reverse-engineering pioneer.',
    perks: [
      '1,400 Cyber Credits instantly granted',
      'Cobalt Aegis Shield Badge',
      'Cobalt Leaderboard Profile Accent',
      'Top 5 Finalist Citation'
    ]
  },
  {
    rank: 5,
    title: 'Zero-Day Pioneer',
    tokensReward: 900,
    badge: '🔮 Violet Valkyrie',
    frameColor: 'border-purple-500 text-purple-300 shadow-purple-500/20 bg-purple-950/40',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    summary: 'High-speed vulnerability discoverer maintaining unmatched solve momentum.',
    perks: [
      '900 Cyber Credits instantly granted',
      'Violet Valkyrie Star Badge',
      'Violet Leaderboard Profile Accent',
      'Top 5 Finalist Citation'
    ]
  }
];

// Purchase Tokens & Credit User Profile
export async function purchaseTokens(
  user: UserProfile,
  pkg: TokenPackage,
  paymentMethod: string
): Promise<{ success: boolean; newTokens: number; message: string; transactionId: string }> {
  const totalCredited = pkg.tokens + pkg.bonusTokens;
  const currentTokens = user.tokens ?? 250;
  const newTokens = currentTokens + totalCredited;
  const txId = `tx-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      tokens: newTokens,
      updatedAt: new Date().toISOString()
    });

    // Broadcast in live activity stream
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId: user.uid,
      teamName: user.teamName ? `${user.username} (${user.teamName})` : user.username,
      challengeTitle: `🛒 Acquired ${totalCredited.toLocaleString()} Cyber Credits [${pkg.name}]`,
      category: 'Web',
      points: 0,
      timestamp: 'Just now',
      isUser: true
    };
    await addDoc(activityCol, activityEvent);

    return {
      success: true,
      newTokens,
      message: `Payment authorized via ${paymentMethod}! +${totalCredited.toLocaleString()} Cyber Credits added to your account.`,
      transactionId: txId
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

// Claim Top 5 Reward Bounty
export async function claimTop5Reward(
  user: UserProfile,
  currentRank: number
): Promise<{ success: boolean; tokensAwarded: number; newTitle: string; message: string }> {
  if (currentRank < 1 || currentRank > 5) {
    throw new Error('User is not currently in the Top 5 of the scoreboard.');
  }

  if (user.claimedTop5Reward) {
    throw new Error('You have already claimed your Season Top 5 reward bounty.');
  }

  const rewardTier = TOP_5_REWARDS.find(r => r.rank === currentRank);
  if (!rewardTier) {
    throw new Error('Reward tier not found for this rank.');
  }

  const currentTokens = user.tokens ?? 250;
  const newTokens = currentTokens + rewardTier.tokensReward;

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      tokens: newTokens,
      claimedTop5Reward: true,
      badgeTitle: rewardTier.title,
      updatedAt: new Date().toISOString()
    });

    // Broadcast podium bounty in live activity stream
    const activityCol = collection(db, ACTIVITY_COLLECTION);
    const activityEvent: Omit<ActivityEvent, 'id'> = {
      userId: user.uid,
      teamName: user.teamName ? `${user.username} (${user.teamName})` : user.username,
      challengeTitle: `🏆 [PODIUM CLAIM] Rank #${currentRank} Crown: +${rewardTier.tokensReward} Credits & "${rewardTier.title}"!`,
      category: 'Crypto',
      points: 0,
      timestamp: 'Just now',
      isFirstBlood: true,
      isUser: true
    };
    await addDoc(activityCol, activityEvent);

    return {
      success: true,
      tokensAwarded: rewardTier.tokensReward,
      newTitle: rewardTier.title,
      message: `Congratulations! You claimed the Rank #${currentRank} "${rewardTier.title}" Bounty: +${rewardTier.tokensReward} Cyber Credits awarded!`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

// Spend Tokens to Unlock Hint without point deduction penalty
export async function spendTokensForHint(
  user: UserProfile,
  hintId: string,
  tokenCost: number
): Promise<{ success: boolean; newTokens: number; message: string }> {
  const currentTokens = user.tokens ?? 250;
  if (currentTokens < tokenCost) {
    throw new Error(`Insufficient Cyber Credits. Need ${tokenCost} tokens, but you have ${currentTokens}.`);
  }

  if (user.unlockedHintIds.includes(hintId)) {
    return { success: true, newTokens: currentTokens, message: 'Hint already unlocked.' };
  }

  const newTokens = currentTokens - tokenCost;
  const newUnlockedHints = [...user.unlockedHintIds, hintId];

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      tokens: newTokens,
      unlockedHintIds: newUnlockedHints,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      newTokens,
      message: `Hint unlocked via Cyber Credits (-${tokenCost} tokens, 0 score penalty).`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

// Daily Free Supply Drop (+50 Tokens every 24h)
export async function claimDailyFreeTokens(
  user: UserProfile
): Promise<{ success: boolean; tokensAwarded: number; message: string }> {
  const todayStr = new Date().toISOString().split('T')[0];
  if (user.lastDailyTokenClaimDate === todayStr) {
    throw new Error('Daily supply drop already claimed today. Returns at 00:00 UTC.');
  }

  const currentTokens = user.tokens ?? 250;
  const bonus = 50;
  const newTokens = currentTokens + bonus;

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      tokens: newTokens,
      lastDailyTokenClaimDate: todayStr,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      tokensAwarded: bonus,
      message: `Daily Supply Drop claimed! +${bonus} Cyber Credits added to your balance.`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

export const ARMORY_ITEMS: ArmoryItem[] = [
  {
    id: 'radar-license',
    name: 'Tactical Recon Drone License',
    category: 'perk',
    tokenCost: 450,
    badge: '🛰️ Recon Radar',
    description: 'Deploys an automated reconnaissance scanner to analyze target challenge architectures, open ports, and potential attack vectors.',
    effect: 'Free tactical recon scans across all CTF challenges'
  },
  {
    id: 'booster-pack-3x',
    name: '3x Solve Token Booster',
    category: 'booster',
    tokenCost: 300,
    badge: '⚡ Overclock',
    description: 'Infuses your solve pipeline with overclocked telemetry, increasing solve token rewards by +100% on your next 3 flag captures.',
    effect: '+100% Cyber Credits on next 3 solves'
  },
  {
    id: 'title-ghost-protocol',
    name: 'Prestige Title: Ghost Protocol',
    category: 'title',
    tokenCost: 200,
    badge: '⚡ Ghost Protocol',
    description: 'Displays a classified cyan insignia badge on your public scoreboard handle and header profile.',
    effect: 'Equippable profile title badge'
  },
  {
    id: 'title-zeroday-hunter',
    name: 'Prestige Title: Zero-Day Hunter',
    category: 'title',
    tokenCost: 400,
    badge: '💀 Zero-Day Hunter',
    description: 'Displays a fearsome skull insignia badge showing your mastery of unknown vulnerabilities.',
    effect: 'Equippable profile title badge'
  },
  {
    id: 'title-cyber-aegis',
    name: 'Prestige Title: Cyber Aegis Sentinel',
    category: 'title',
    tokenCost: 650,
    badge: '🛡️ Aegis Sentinel',
    description: 'Displays an elite emerald shield title badge on all CTF team roster listings.',
    effect: 'Equippable profile title badge'
  },
  {
    id: 'title-sovereign-archon',
    name: 'Prestige Title: Sovereign Archon',
    category: 'title',
    tokenCost: 1200,
    badge: '👑 Sovereign Archon',
    description: 'Supreme holographic crown badge for top-tier CTF warlords and syndicate commanders.',
    effect: 'Equippable profile title badge'
  }
];

export async function purchaseArmoryItem(
  user: UserProfile,
  item: ArmoryItem
): Promise<{ success: boolean; newTokens: number; message: string }> {
  const currentTokens = user.tokens ?? 250;
  if (currentTokens < item.tokenCost) {
    throw new Error(`Insufficient Cyber Credits. Need ${item.tokenCost} tokens, but you have ${currentTokens}.`);
  }

  const currentInventory = user.inventory || [];
  if (currentInventory.includes(item.id)) {
    throw new Error('You already own this item in your Armory.');
  }

  const newTokens = currentTokens - item.tokenCost;
  const newInventory = [...currentInventory, item.id];
  const updates: Record<string, unknown> = {
    tokens: newTokens,
    inventory: newInventory,
    updatedAt: new Date().toISOString()
  };

  if (item.id === 'radar-license') {
    updates.hasRadarLicense = true;
  } else if (item.id === 'booster-pack-3x') {
    updates.tokenBoosterCount = (user.tokenBoosterCount || 0) + 3;
  } else if (item.category === 'title') {
    updates.badgeTitle = item.badge;
  }

  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, updates);

    return {
      success: true,
      newTokens,
      message: `Acquired "${item.name}"! ${item.effect}.`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}

export async function equipTitle(
  user: UserProfile,
  titleBadge: string
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    await updateDoc(userRef, {
      badgeTitle: titleBadge,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `Equipped title "${titleBadge}" to your public profile.`
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${USERS_COLLECTION}/${user.uid}`);
    throw err;
  }
}
