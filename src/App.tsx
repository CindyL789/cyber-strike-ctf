import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Shield,
  Trophy,
  Activity,
  CheckCircle2,
  Terminal,
  Search,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  Zap,
  Filter,
  ShieldAlert,
  LogIn
} from 'lucide-react';

import { Category, Difficulty, Challenge, TeamScore, ActivityEvent, UserProfile } from './types/ctf';
import { INITIAL_CHALLENGES, INITIAL_TEAMS, INITIAL_ACTIVITY } from './data/challenges';
import { Header } from './components/Header';
import { ChallengeModal } from './components/ChallengeModal';
import { CyberWorkbench } from './components/CyberWorkbench';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveFeedView } from './components/LiveFeedView';
import { RulesView } from './components/RulesView';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TeamHubView } from './components/TeamHubView';
import { DailyOpBanner } from './components/DailyOpBanner';
import { TokenStoreModal } from './components/TokenStoreModal';
import { Top5PodiumModal } from './components/Top5PodiumModal';
import { sound } from './utils/audio';

// Services
import { subscribeToAuthProfile, logoutPlayer } from './services/authService';
import {
  subscribeToChallenges,
  subscribeToActivity,
  submitFlag,
  unlockHint
} from './services/challengeService';
import { subscribeToScoreboard } from './services/scoreboardService';
import { ensureDailyChallengePublished, getDailyOpInfo } from './services/dailyChallengeService';
import { spendTokensForHint } from './services/tokenService';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [teams, setTeams] = useState<TeamScore[]>(INITIAL_TEAMS);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);

  // Local solve fallback if playing guest before signup
  const [guestSolvedIds, setGuestSolvedIds] = useState<string[]>([]);
  const [guestUnlockedHints, setGuestUnlockedHints] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<'All' | Category>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | Difficulty>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'challenges' | 'scoreboard' | 'activity' | 'teams' | 'rules' | 'admin'>('challenges');
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [isDailyFilterActive, setIsDailyFilterActive] = useState(false);
  const [isTokenStoreOpen, setIsTokenStoreOpen] = useState(false);
  const [isTop5PodiumOpen, setIsTop5PodiumOpen] = useState(false);
  const [guestTokens, setGuestTokens] = useState<number>(250);

  // 1. Subscribe to Firebase Auth and User Profile
  useEffect(() => {
    const unsub = subscribeToAuthProfile(profile => {
      setUserProfile(profile);
    });
    return () => unsub();
  }, []);

  // 2. Ensure today's Daily Challenge is initialized in Firestore
  useEffect(() => {
    ensureDailyChallengePublished().catch(err => {
      console.warn('Daily challenge auto-seed notice:', err);
    });
  }, []);

  // 3. Subscribe to Challenges in Firestore
  useEffect(() => {
    const unsub = subscribeToChallenges(updatedChallenges => {
      setChallenges(updatedChallenges);
    });
    return () => unsub();
  }, []);

  // 3. Subscribe to Real-Time Scoreboard
  useEffect(() => {
    const unsub = subscribeToScoreboard(userProfile?.uid || null, liveTeams => {
      setTeams(liveTeams);
    });
    return () => unsub();
  }, [userProfile?.uid]);

  // 4. Subscribe to Live Activity Feed
  useEffect(() => {
    const unsub = subscribeToActivity(events => {
      if (events.length > 0) {
        setActivities(events);
      }
    });
    return () => unsub();
  }, []);

  // Compute effective solved challenge IDs & unlocked hints
  const solvedIds = useMemo(() => {
    if (userProfile) {
      return userProfile.solvedChallengeIds || [];
    }
    return guestSolvedIds;
  }, [userProfile, guestSolvedIds]);

  const unlockedHints = useMemo(() => {
    if (userProfile) {
      return userProfile.unlockedHintIds || [];
    }
    return guestUnlockedHints;
  }, [userProfile, guestUnlockedHints]);

  // User Rank on scoreboard
  const userRank = useMemo(() => {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    if (!userProfile) return teams.length + 1;
    const idx = sorted.findIndex(t => t.id === userProfile.uid);
    return idx === -1 ? sorted.length : idx + 1;
  }, [teams, userProfile]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b']
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleFlagSubmission = (challengeId: string, flag: string): boolean => {
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch) return false;

    if (flag.trim() === ch.flag.trim()) {
      if (userProfile) {
        // Sync with Firestore database
        submitFlag(userProfile, ch, flag)
          .then(res => {
            if (res.success) {
              triggerConfetti();
              sound.playSuccess();
              setBannerNotice(res.message);
              setTimeout(() => setBannerNotice(null), 5000);
            }
          })
          .catch(err => {
            console.error('Error submitting flag to database:', err);
            setBannerNotice('Database sync error. Please check connection.');
          });
      } else {
        // Guest mode solve
        if (!guestSolvedIds.includes(challengeId)) {
          setGuestSolvedIds(prev => [...prev, challengeId]);
          triggerConfetti();
          sound.playSuccess();
          setBannerNotice(`Flag Captured! Sign up or log in to record this permanently on the live scoreboard.`);
          setTimeout(() => setBannerNotice(null), 6000);
        }
      }
      return true;
    }

    return false;
  };

  // Quick submit from top header bar
  const handleQuickSubmit = (flag: string) => {
    const clean = flag.trim();
    const matched = challenges.find(c => c.flag.trim() === clean);
    if (matched) {
      handleFlagSubmission(matched.id, clean);
    } else {
      sound.playError();
      setBannerNotice(`Flag rejection: No active challenge matches this hash.`);
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleUnlockHint = (challengeId: string, hintId: string, cost: number) => {
    if (userProfile) {
      unlockHint(userProfile, hintId, cost)
        .then(() => {
          sound.playHint();
          setBannerNotice(`Hint unlocked (-${cost} pts penalty applied to cloud database).`);
          setTimeout(() => setBannerNotice(null), 3000);
        })
        .catch(err => {
          console.error('Hint unlock error:', err);
        });
    } else {
      if (!guestUnlockedHints.includes(hintId)) {
        setGuestUnlockedHints(prev => [...prev, hintId]);
        sound.playHint();
        setBannerNotice(`Hint unlocked (-${cost} pts penalty applied).`);
        setTimeout(() => setBannerNotice(null), 3000);
      }
    }
  };

  const handleUnlockHintWithTokens = (challengeId: string, hintId: string, tokenCost: number) => {
    if (userProfile) {
      spendTokensForHint(userProfile, hintId, tokenCost)
        .then(res => {
          sound.playHint();
          setBannerNotice(`Hint unlocked via ${tokenCost} Cyber Credits (0 score penalty).`);
          setTimeout(() => setBannerNotice(null), 3000);
        })
        .catch(err => {
          sound.playError();
          setBannerNotice((err as Error).message || 'Failed to unlock hint with credits.');
          setTimeout(() => setBannerNotice(null), 3500);
        });
    } else {
      if (guestTokens < tokenCost) {
        sound.playError();
        setBannerNotice(`Insufficient credits. You have ${guestTokens} credits. Register or get more tokens!`);
        setTimeout(() => setBannerNotice(null), 3500);
        return;
      }
      if (!guestUnlockedHints.includes(hintId)) {
        setGuestTokens(prev => Math.max(0, prev - tokenCost));
        setGuestUnlockedHints(prev => [...prev, hintId]);
        sound.playHint();
        setBannerNotice(`Hint unlocked via ${tokenCost} Cyber Credits (0 score penalty).`);
        setTimeout(() => setBannerNotice(null), 3000);
      }
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const handleLogout = async () => {
    sound.playClick();
    await logoutPlayer();
    setUserProfile(null);
    setCurrentTab('challenges');
    setBannerNotice('Successfully signed out of session.');
    setTimeout(() => setBannerNotice(null), 3000);
  };

  // Compute daily challenge operation status
  const dailyOpInfo = useMemo(() => {
    return getDailyOpInfo(challenges, userProfile);
  }, [challenges, userProfile]);

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      if (isDailyFilterActive && !c.isDaily && c.id !== dailyOpInfo.challengeId) {
        return false;
      }
      const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || c.difficulty === selectedDifficulty;
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchDiff && matchSearch;
    });
  }, [challenges, selectedCategory, selectedDifficulty, searchQuery, isDailyFilterActive, dailyOpInfo.challengeId]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userProfile={userProfile}
        userRank={userRank}
        onOpenWorkbench={() => setIsWorkbenchOpen(true)}
        onQuickSubmitFlag={handleQuickSubmit}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        onOpenTop5Podium={() => setIsTop5PodiumOpen(true)}
      />

      {/* Temporary Alert Banner */}
      {bannerNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-center text-xs font-mono text-emerald-300 animate-in fade-in">
          {bannerNotice}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Unauthenticated Encouragement Banner */}
        {!userProfile && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Join the Live Competitive Scoreboard</div>
                <div className="text-[11px] text-slate-400">
                  Register with a username & password to securely persist your progress, solves, and real-time rankings in Firestore.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsAuthModalOpen(true);
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Create Account / Log In</span>
            </button>
          </div>
        )}

        {/* Navigation Tab: CHALLENGES */}
        {currentTab === 'challenges' && (
          <div className="space-y-6">
            {/* Daily Operation Special Mission Banner */}
            <DailyOpBanner
              dailyInfo={dailyOpInfo}
              userProfile={userProfile}
              onLaunchDaily={ch => {
                sound.playClick();
                setActiveChallenge(ch);
              }}
              onFilterDailyOps={() => {
                setIsDailyFilterActive(prev => !prev);
              }}
              isDailyFilterActive={isDailyFilterActive}
            />

            {/* Arena Status & Telemetry Banner */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>Live CTF Challenge Matrix</span>
                    {userProfile?.role === 'admin' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ADMIN ACCESS
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-slate-400">
                    Solve real sandboxed vulnerabilities across Web, Crypto, Reverse, Forensics, and Pwn.
                  </p>
                </div>

                {/* Score & Rank Metrics with Tabular Numbers */}
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px] uppercase">Score</div>
                    <div className="text-emerald-400 font-bold text-base tabular-nums">
                      {userProfile?.score ?? 0} pts
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px] uppercase">Solves</div>
                    <div className="text-slate-100 font-bold text-base tabular-nums">
                      {solvedIds.length} / {challenges.length}
                    </div>
                  </div>
                  {userProfile && (
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <div className="text-slate-500 text-[10px] uppercase">Daily Streak</div>
                      <div className="text-orange-400 font-bold text-base tabular-nums flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                        <span>{userProfile.dailyStreak || 0}d</span>
                      </div>
                    </div>
                  )}
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px] uppercase">Live Rank</div>
                    <div className="text-amber-400 font-bold text-base tabular-nums">
                      #{userRank}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Progress */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                <span className="text-[11px] text-slate-500 uppercase">Domain Coverage:</span>
                {(['Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'] as Category[]).map(cat => {
                  const solvedInCat = challenges.filter(c => c.category === cat && solvedIds.includes(c.id)).length;
                  const totalInCat = challenges.filter(c => c.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center gap-1.5">
                      <span className="text-slate-300 font-sans">{cat}:</span>
                      <span className="text-emerald-400 font-bold tabular-nums">
                        {solvedInCat}/{totalInCat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Category & Difficulty Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-xs">
                  {(['All', 'Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsDailyFilterActive(prev => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isDailyFilterActive
                        ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/50'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                    title="Filter challenges to daily operations"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daily Ops</span>
                  </button>
                </div>

                {/* Difficulty Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-xs">
                  {(['All', 'Easy', 'Medium', 'Hard', 'Insane'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => {
                        sound.playClick();
                        setSelectedDifficulty(diff);
                      }}
                      className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                        selectedDifficulty === diff
                          ? diff === 'Insane'
                            ? 'bg-purple-950/80 text-purple-300 shadow-sm border border-purple-500/50'
                            : diff === 'Hard'
                            ? 'bg-rose-950/80 text-rose-300 shadow-sm border border-rose-500/50'
                            : 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff === 'Insane' ? '⚡ Insane' : diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter challenges or tags..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map(challenge => {
                const isSolved = solvedIds.includes(challenge.id);
                return (
                  <div
                    key={challenge.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveChallenge(challenge);
                    }}
                    className={`group p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSolved
                        ? 'bg-slate-950/60 border-emerald-500/40 hover:border-emerald-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Zero-Pill Unboxed Metadata Header */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-400">{challenge.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              challenge.difficulty === 'Easy'
                                ? 'text-emerald-300'
                                : challenge.difficulty === 'Medium'
                                ? 'text-amber-300'
                                : challenge.difficulty === 'Hard'
                                ? 'text-rose-300'
                                : 'text-purple-300 font-bold flex items-center gap-1'
                            }
                          >
                            {challenge.difficulty === 'Insane' && <span>⚡</span>}
                            {challenge.difficulty}
                          </span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold tabular-nums">
                          {challenge.points} pts
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                        <span>{challenge.title}</span>
                        {isSolved && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </h3>

                      {/* Description excerpt */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {challenge.description}
                      </p>

                      {/* Tag hints */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {challenge.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Metadata + Action */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-[11px]">{challenge.solvesCount} solves</span>
                      <button
                        className={`font-medium flex items-center gap-1.5 transition-colors ${
                          isSolved
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
                        <span>{isSolved ? 'Review Sandbox' : 'Launch Target'}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Tab: SCOREBOARD */}
        {currentTab === 'scoreboard' && (
          <LeaderboardView
            teams={teams}
            userProfile={userProfile}
            onOpenTop5Podium={() => setIsTop5PodiumOpen(true)}
          />
        )}

        {/* Navigation Tab: SQUADS / TEAMS */}
        {currentTab === 'teams' && (
          <TeamHubView
            userProfile={userProfile}
            allChallenges={challenges}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onNotice={msg => {
              setBannerNotice(msg);
              setTimeout(() => setBannerNotice(null), 5000);
            }}
            teamsLeaderboard={teams}
          />
        )}

        {/* Navigation Tab: ACTIVITY FEED */}
        {currentTab === 'activity' && <LiveFeedView activities={activities} />}

        {/* Navigation Tab: RULES */}
        {currentTab === 'rules' && <RulesView />}

        {/* Navigation Tab: ADMIN DASHBOARD */}
        {currentTab === 'admin' && userProfile?.role === 'admin' && (
          <AdminDashboard challenges={challenges} />
        )}
      </main>

      {/* Challenge Target Modal */}
      {activeChallenge && (
        <ChallengeModal
          challenge={activeChallenge}
          isSolved={solvedIds.includes(activeChallenge.id)}
          unlockedHints={unlockedHints}
          userTokens={userProfile ? (userProfile.tokens ?? 250) : guestTokens}
          onClose={() => setActiveChallenge(null)}
          onSubmitFlag={handleFlagSubmission}
          onUnlockHint={handleUnlockHint}
          onUnlockHintWithTokens={handleUnlockHintWithTokens}
          onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        />
      )}

      {/* Multi-Tool Cyber Workbench Modal */}
      <CyberWorkbench
        isOpen={isWorkbenchOpen}
        onClose={() => setIsWorkbenchOpen(false)}
      />

      {/* Cyber Credits Armory & Exchange Modal */}
      <TokenStoreModal
        isOpen={isTokenStoreOpen}
        onClose={() => setIsTokenStoreOpen(false)}
        userProfile={userProfile}
        onOpenAuth={() => {
          setIsTokenStoreOpen(false);
          setIsAuthModalOpen(true);
        }}
        onSuccessNotice={msg => {
          setBannerNotice(msg);
          setTimeout(() => setBannerNotice(null), 5000);
        }}
      />

      {/* Season Top 5 Championship Bounty & Rewards Modal */}
      <Top5PodiumModal
        isOpen={isTop5PodiumOpen}
        onClose={() => setIsTop5PodiumOpen(false)}
        userProfile={userProfile}
        userRank={userRank}
        teamsLeaderboard={teams}
        onOpenAuth={() => {
          setIsTop5PodiumOpen(false);
          setIsAuthModalOpen(true);
        }}
        onSuccessNotice={msg => {
          setBannerNotice(msg);
          setTimeout(() => setBannerNotice(null), 5000);
        }}
      />

      {/* User Registration & Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={profile => {
          setUserProfile(profile);
          setBannerNotice(`Welcome operator @${profile.username}! Connected to live database.`);
          setTimeout(() => setBannerNotice(null), 4000);
        }}
      />
    </div>
  );
}
