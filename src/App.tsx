import React, { useState, useEffect, useMemo } from 'react';
import {
  Flag,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Trophy,
  Terminal,
  Shield,
  Zap,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  Skull,
  Layers,
  Award,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Types
import { Challenge, Category, Difficulty, UserProfile, TeamScore, ActivityEvent } from './types/ctf';
import { INITIAL_CHALLENGES, INITIAL_TEAMS, INITIAL_ACTIVITY } from './data/challenges';

// Services
import {
  subscribeToChallenges,
  subscribeToActivity,
  submitFlag,
  unlockHint
} from './services/challengeService';
import { subscribeToScoreboard } from './services/scoreboardService';
import {
  subscribeToAuthProfile,
  loginPlayer,
  registerPlayer,
  logoutPlayer
} from './services/authService';
import { getDailyOpInfo } from './services/dailyChallengeService';
import { unlockHintWithTokens } from './services/tokenService';
import { sound } from './utils/audio';

// Components
import { Header } from './components/Header';
import { ChallengeModal } from './components/ChallengeModal';
import { CyberWorkbench } from './components/CyberWorkbench';
import { DailyOpBanner } from './components/DailyOpBanner';
import { LeaderboardView } from './components/LeaderboardView';
import { LiveFeedView } from './components/LiveFeedView';
import { RulesView } from './components/RulesView';
import { TeamHubView } from './components/TeamHubView';
import { TokenStoreModal } from './components/TokenStoreModal';
import { Top5PodiumModal } from './components/Top5PodiumModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SystemShell } from './components/SystemShell';

type TabType = 'challenges' | 'scoreboard' | 'activity' | 'teams' | 'rules' | 'admin' | 'shell';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [teams, setTeams] = useState<TeamScore[]>(INITIAL_TEAMS);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Guest State Fallback (when not logged in)
  const [guestSolvedIds, setGuestSolvedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberstrike_guest_solves') || '[]');
    } catch {
      return [];
    }
  });
  const [guestScore, setGuestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('cyberstrike_guest_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [guestTokens, setGuestTokens] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('cyberstrike_guest_tokens') || '250', 10);
    } catch {
      return 250;
    }
  });
  const [guestHints, setGuestHints] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberstrike_guest_hints') || '[]');
    } catch {
      return [];
    }
  });
  const [guestInventory, setGuestInventory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberstrike_guest_inventory') || '[]');
    } catch {
      return [];
    }
  });

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Solved' | 'Unsolved'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hardcoreMode, setHardcoreMode] = useState<boolean>(false);

  // Active Challenge Modal
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);

  // Tools & Modals
  const [workbenchOpen, setWorkbenchOpen] = useState<boolean>(false);
  const [tokenStoreOpen, setTokenStoreOpen] = useState<boolean>(false);
  const [podiumOpen, setPodiumOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authUsername, setAuthUsername] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Listen to Firestore real-time streams
  useEffect(() => {
    const unsubChallenges = subscribeToChallenges(list => {
      setChallenges(list);
    });

    const unsubTeams = subscribeToScoreboard(list => {
      setTeams(list);
    });

    const unsubActivity = subscribeToActivity(list => {
      setActivities(list);
    });

    const unsubAuth = subscribeToAuthProfile(profile => {
      setUserProfile(profile);
    });

    return () => {
      unsubChallenges();
      unsubTeams();
      unsubActivity();
      if (typeof unsubAuth === 'function') unsubAuth();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  const solvedIds = useMemo(() => {
    return userProfile ? userProfile.solvedChallengeIds || [] : guestSolvedIds;
  }, [userProfile, guestSolvedIds]);

  const unlockedHintIds = useMemo(() => {
    return userProfile ? userProfile.unlockedHintIds || [] : guestHints;
  }, [userProfile, guestHints]);

  const currentScore = userProfile ? userProfile.score : guestScore;

  // Calculate Rank
  const userRank = useMemo(() => {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(t => t.name === (userProfile?.username || 'GhostProtocol'));
    return index !== -1 ? index + 1 : 6;
  }, [teams, userProfile]);

  // Daily Operation Info
  const dailyOp = useMemo(() => {
    return getDailyOpInfo(challenges, solvedIds);
  }, [challenges, solvedIds]);

  // Filtered Challenges
  const filteredChallenges = useMemo(() => {
    return challenges.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedDifficulty !== 'All' && c.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = c.description.toLowerCase().includes(q);
        const inTags = c.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) return false;
      }
      const isSolved = solvedIds.includes(c.id);
      if (statusFilter === 'Solved' && !isSolved) return false;
      if (statusFilter === 'Unsolved' && isSolved) return false;
      return true;
    });
  }, [challenges, selectedCategory, selectedDifficulty, statusFilter, searchQuery, solvedIds]);

  // Handle Flag Submission
  const handleFlagSubmit = (challengeId: string, flag: string): boolean => {
    const ch = challenges.find(c => c.id === challengeId);
    if (!ch) return false;

    const isMatch = ch.flag.trim() === flag.trim();
    if (!isMatch) return false;

    if (solvedIds.includes(challengeId)) {
      showToast('Challenge already solved! No duplicate points.');
      return true;
    }

    // Apply Hardcore multiplier (+25% score bonus)
    const bonusMultiplier = hardcoreMode ? 1.25 : 1.0;
    const finalPoints = Math.round(ch.points * bonusMultiplier);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    if (userProfile) {
      submitFlag(userProfile, ch, flag.trim()).catch(() => {
        // Handled in service
      });
      showToast(`Flag Captured! +${finalPoints} points awarded ${hardcoreMode ? '(HARDCORE +25% BONUS!)' : ''}`);
    } else {
      // Guest local storage
      const newSolves = [...guestSolvedIds, challengeId];
      const newScore = guestScore + finalPoints;
      const newTokens = guestTokens + (hardcoreMode ? 75 : 50);

      setGuestSolvedIds(newSolves);
      setGuestScore(newScore);
      setGuestTokens(newTokens);

      localStorage.setItem('cyberstrike_guest_solves', JSON.stringify(newSolves));
      localStorage.setItem('cyberstrike_guest_score', newScore.toString());
      localStorage.setItem('cyberstrike_guest_tokens', newTokens.toString());

      showToast(`Flag Captured as Guest! +${finalPoints} points ${hardcoreMode ? '(HARDCORE +25% BONUS!)' : ''}`);
    }

    return true;
  };

  const handleQuickSubmitFlag = (flag: string) => {
    sound.playClick();
    const clean = flag.trim();
    const match = challenges.find(c => c.flag.trim() === clean);
    if (match) {
      handleFlagSubmit(match.id, clean);
      sound.playSuccess();
    } else {
      sound.playError();
      showToast('Flag rejected. No matching operation found.');
    }
  };

  const handleUnlockHint = async (challengeId: string, hintId: string, cost: number) => {
    if (hardcoreMode) {
      sound.playError();
      showToast('HARDCORE MODE: Tactical hints are restricted in competitive mode!');
      return;
    }

    sound.playClick();
    if (unlockedHintIds.includes(hintId)) return;

    if (userProfile) {
      await unlockHint(userProfile, challengeId, hintId, cost);
    } else {
      const newHints = [...guestHints, hintId];
      const newScore = Math.max(0, guestScore - cost);
      setGuestHints(newHints);
      setGuestScore(newScore);
      localStorage.setItem('cyberstrike_guest_hints', JSON.stringify(newHints));
      localStorage.setItem('cyberstrike_guest_score', newScore.toString());
    }
    sound.playSuccess();
    showToast(`Hint unlocked (-${cost} score penalty).`);
  };

  const handleUnlockHintWithTokens = async (challengeId: string, hintId: string, tokenCost: number) => {
    sound.playClick();
    if (unlockedHintIds.includes(hintId)) return;

    if (userProfile) {
      const res = await unlockHintWithTokens(userProfile, hintId, tokenCost);
      if (res.success) {
        sound.playSuccess();
        showToast(res.message);
      } else {
        sound.playError();
        showToast(res.message);
      }
    } else {
      if (guestTokens < tokenCost) {
        sound.playError();
        showToast('Insufficient Cyber Credits. Open the Store to acquire credits.');
        return;
      }
      const newTokens = guestTokens - tokenCost;
      const newHints = [...guestHints, hintId];
      setGuestTokens(newTokens);
      setGuestHints(newHints);
      localStorage.setItem('cyberstrike_guest_tokens', newTokens.toString());
      localStorage.setItem('cyberstrike_guest_hints', JSON.stringify(newHints));
      sound.playSuccess();
      showToast(`Hint unlocked with ${tokenCost} Cyber Credits (Zero score penalty preserved).`);
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await loginPlayer(authEmail, authPassword);
        showToast('Authenticated successfully.');
      } else {
        if (!authUsername.trim()) {
          setAuthError('Callsign/Username is required.');
          setAuthLoading(false);
          return;
        }
        await registerPlayer(authEmail, authPassword, authUsername.trim());
        showToast(`Operative @${authUsername.trim()} registered! +250 Welcome Credits added.`);
      }
      setAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthUsername('');
    } catch (err: unknown) {
      sound.playError();
      const error = err as Error;
      setAuthError(error.message || 'Authentication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    await logoutPlayer();
    showToast('Signed out of session.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 border border-emerald-500/60 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono text-white animate-in slide-in-from-bottom duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={t => {
          sound.playClick();
          setCurrentTab(t);
        }}
        userProfile={userProfile}
        userRank={userRank}
        onOpenWorkbench={() => setWorkbenchOpen(true)}
        onQuickSubmitFlag={handleQuickSubmitFlag}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          sound.toggle();
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenTokenStore={() => setTokenStoreOpen(true)}
        onOpenTop5Podium={() => setPodiumOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hardcore Mode Banner Alert */}
        {hardcoreMode && (
          <div className="p-4 bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border border-rose-500/60 rounded-2xl flex items-center justify-between gap-4 shadow-2xl animate-pulse font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Skull className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-rose-300 uppercase tracking-wider">
                  Hardcore Competitive Mode Active
                </span>
                <p className="text-[11px] text-slate-300">
                  Hints are restricted. Exploit parameters are unguided. Captures earn +25% bonus points and +50% Cyber Credits!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setHardcoreMode(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs shrink-0"
            >
              Exit Hardcore
            </button>
          </div>
        )}

        {/* TAB 1: OPERATIONS / CHALLENGES */}
        {currentTab === 'challenges' && (
          <div className="space-y-6">
            {/* Daily Operation Showcase */}
            {dailyOp.challenge && (
              <DailyOpBanner
                dailyOp={dailyOp}
                onSelectChallenge={() => setActiveChallenge(dailyOp.challenge)}
                isFilterActive={selectedCategory === dailyOp.challenge.category}
                onToggleFilter={() => {
                  sound.playClick();
                  setSelectedCategory(
                    selectedCategory === dailyOp.challenge.category ? 'All' : dailyOp.challenge.category
                  );
                }}
              />
            )}

            {/* Filter and Control Bar */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3 font-mono text-xs shadow-lg backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search operations by vulnerability, title, or technique..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Hardcore Mode Toggle */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setHardcoreMode(prev => !prev);
                  }}
                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 font-bold transition-all shadow-sm ${
                    hardcoreMode
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Skull className={`w-4 h-4 ${hardcoreMode ? 'text-rose-400 fill-rose-500/20' : ''}`} />
                  <span>Hardcore Mode: {hardcoreMode ? 'ON (+25% PTS)' : 'OFF'}</span>
                </button>
              </div>

              {/* Categorical & Difficulty Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Sector:</span>
                  {(['All', 'Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Difficulty Filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 mr-1">Difficulty:</span>
                  {(['All', 'Medium', 'Hard', 'Insane', 'Nightmare'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => {
                        sound.playClick();
                        setSelectedDifficulty(diff);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedDifficulty === diff
                          ? diff === 'Nightmare'
                            ? 'bg-rose-600 text-white font-extrabold shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                            : 'bg-indigo-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                  {(['All', 'Solved', 'Unsolved'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        sound.playClick();
                        setStatusFilter(st);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                        statusFilter === st ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map(ch => {
                const isSolved = solvedIds.includes(ch.id);
                const isNightmare = ch.difficulty === 'Nightmare';
                const isInsane = ch.difficulty === 'Insane';

                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveChallenge(ch);
                    }}
                    className={`group relative p-5 bg-slate-900 border rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 ${
                      isSolved
                        ? 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-400'
                        : isNightmare
                        ? 'border-rose-500/50 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-950 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                        : isInsane
                        ? 'border-purple-500/40 hover:border-purple-400'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {ch.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isNightmare
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                : isInsane
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : ch.difficulty === 'Hard'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ch.difficulty}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-bold">
                            {ch.points} pts
                          </span>
                        </div>
                      </div>

                      {/* Title & Author */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                          <span>{ch.title}</span>
                          {isSolved && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {ch.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ch.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom stats & Launch Trigger */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{ch.solvesCount} solves</span>
                        <span aria-hidden="true">·</span>
                        <span>@{ch.author}</span>
                      </div>

                      <span className="text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                        <span>{isSolved ? 'Review' : 'Deploy Target'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredChallenges.length === 0 && (
              <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="font-bold text-slate-300">No Operations Match the Filter</div>
                <p className="text-xs text-slate-500">Try loosening your search query or sector filters.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCOREBOARD */}
        {currentTab === 'scoreboard' && (
          <LeaderboardView
            teams={teams}
            userProfile={userProfile}
            onOpenTop5Podium={() => setPodiumOpen(true)}
          />
        )}

        {/* TAB 3: LIVE FEED */}
        {currentTab === 'activity' && <LiveFeedView activities={activities} />}

        {/* TAB 4: SQUADS / TEAMS */}
        {currentTab === 'teams' && (
          <TeamHubView
            userProfile={userProfile}
            allChallenges={challenges}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNotice={showToast}
            teamsLeaderboard={teams}
          />
        )}

        {/* TAB 5: RULES OF ENGAGEMENT */}
        {currentTab === 'rules' && <RulesView />}

        {/* TAB 6: ADMIN CONSOLE */}
        {currentTab === 'admin' && <AdminDashboard challenges={challenges} />}

        {/* TAB 7: SYSTEM SHELL COMPONENT */}
        {currentTab === 'shell' && (
          <SystemShell
            challenges={challenges}
            userProfile={userProfile}
            onSubmitFlag={handleFlagSubmit}
            onOpenChallenge={ch => setActiveChallenge(ch)}
          />
        )}
      </main>

      {/* MODAL 1: Challenge Modal with Interactive Sandboxes */}
      {activeChallenge && (
        <ChallengeModal
          challenge={activeChallenge}
          isSolved={solvedIds.includes(activeChallenge.id)}
          unlockedHints={unlockedHintIds}
          userTokens={userProfile ? userProfile.tokens ?? 250 : guestTokens}
          hasRadarLicense={Boolean(userProfile?.hasRadarLicense || guestInventory.includes('radar-license'))}
          onClose={() => setActiveChallenge(null)}
          onSubmitFlag={handleFlagSubmit}
          onUnlockHint={handleUnlockHint}
          onUnlockHintWithTokens={handleUnlockHintWithTokens}
          onOpenTokenStore={() => setTokenStoreOpen(true)}
          onOpenShell={() => {
            setActiveChallenge(null);
            setCurrentTab('shell');
          }}
        />
      )}

      {/* MODAL 2: Cyber Workbench */}
      <CyberWorkbench isOpen={workbenchOpen} onClose={() => setWorkbenchOpen(false)} />

      {/* MODAL 3: Cyber Credits Token Store & Armory */}
      <TokenStoreModal
        isOpen={tokenStoreOpen}
        onClose={() => setTokenStoreOpen(false)}
        userProfile={userProfile}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSuccessNotice={showToast}
        guestTokens={guestTokens}
        onUpdateGuestTokens={tokens => {
          setGuestTokens(tokens);
          localStorage.setItem('cyberstrike_guest_tokens', tokens.toString());
        }}
        guestInventory={guestInventory}
        onUpdateGuestInventory={id => {
          const updated = [...guestInventory, id];
          setGuestInventory(updated);
          localStorage.setItem('cyberstrike_guest_inventory', JSON.stringify(updated));
        }}
      />

      {/* MODAL 4: Top 5 Podium Season Bounty */}
      <Top5PodiumModal
        isOpen={podiumOpen}
        onClose={() => setPodiumOpen(false)}
        userProfile={userProfile}
        userRank={userRank}
        teamsLeaderboard={teams}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSuccessNotice={showToast}
      />

      {/* MODAL 5: Auth Sign-In / Register Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono text-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {authMode === 'login' ? 'Operative Identification' : 'Enlist Operative'}
                </h3>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="text-slate-400 text-[11px]">Callsign / Username:</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={e => setAuthUsername(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. CipherPhantom"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-400 text-[11px]">Secure Email Address:</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="agent@cyberstrike.io"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">Passcode / Password:</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow flex items-center justify-center gap-2 mt-2"
              >
                <span>{authLoading ? 'Verifying Credentials...' : authMode === 'login' ? 'Authenticate' : 'Complete Enlistment'}</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 text-center text-slate-400 text-[11px]">
              {authMode === 'login' ? (
                <span>
                  New recruit?{' '}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Enlist Call-Sign
                  </button>
                </span>
              ) : (
                <span>
                  Existing operator?{' '}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Identify Session
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
