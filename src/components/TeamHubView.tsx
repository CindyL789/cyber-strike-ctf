import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Copy,
  Check,
  Crown,
  Share2,
  RefreshCw,
  LogOut,
  Sparkles,
  Trophy,
  CheckCircle2,
  Flame,
  Globe,
  Lock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Team, UserProfile, Challenge, TeamScore } from '../types/ctf';
import {
  createTeam,
  joinTeamByInviteCode,
  joinPublicTeam,
  leaveTeam,
  regenerateInviteCode,
  updateTeamSettings,
  subscribeToTeam,
  subscribeToAllTeams
} from '../services/teamService';
import { sound } from '../utils/audio';

interface Props {
  userProfile: UserProfile | null;
  allChallenges: Challenge[];
  onOpenAuth: () => void;
  onNotice: (msg: string) => void;
  teamsLeaderboard: TeamScore[];
}

export const TeamHubView: React.FC<Props> = ({
  userProfile,
  allChallenges,
  onOpenAuth,
  onNotice,
  teamsLeaderboard
}) => {
  // Navigation within Team Hub
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'join' | 'directory'>('create');

  // Form states for creating a team
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [description, setDescription] = useState('');
  const [isOpenRecruitment, setIsOpenRecruitment] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for joining via code
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Team live state
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  // 1. Subscribe to the user's team if they belong to one
  useEffect(() => {
    if (!userProfile?.teamId) {
      setUserTeam(null);
      return;
    }
    const unsub = subscribeToTeam(userProfile.teamId, team => {
      setUserTeam(team);
    });
    return () => unsub();
  }, [userProfile?.teamId]);

  // 2. Subscribe to all teams for directory and stats
  useEffect(() => {
    const unsub = subscribeToAllTeams(teams => {
      setAllTeams(teams);
    });
    return () => unsub();
  }, []);

  // Copy invitation code to clipboard
  const handleCopyInviteCode = (code: string) => {
    sound.playClick();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onNotice(`Invite Code ${code} copied to clipboard! Share with your squad.`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Handle Team Creation
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    if (!teamName.trim() || !teamTag.trim()) {
      sound.playError();
      onNotice('Please provide a team name and tag.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const created = await createTeam(
        userProfile,
        teamName,
        teamTag,
        description,
        isOpenRecruitment,
        allChallenges
      );
      sound.playSuccess();
      onNotice(`Team [${created.tag}] ${created.name} successfully created! Solves aggregated.`);
    } catch (err: unknown) {
      sound.playError();
      const msg = err instanceof Error ? err.message : 'Failed to create team.';
      onNotice(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Join by Invite Code
  const handleJoinByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    if (!inviteCodeInput.trim()) {
      sound.playError();
      onNotice('Please enter an invitation code.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    try {
      const joined = await joinTeamByInviteCode(userProfile, inviteCodeInput, allChallenges);
      sound.playSuccess();
      onNotice(`Joined team [${joined.tag}] ${joined.name}! Solves & scores combined on the leaderboard.`);
      setInviteCodeInput('');
    } catch (err: unknown) {
      sound.playError();
      const msg = err instanceof Error ? err.message : 'Invalid invite code or network issue.';
      onNotice(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Join Open Public Team
  const handleJoinPublic = async (team: Team) => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    sound.playClick();
    setIsSubmitting(true);
    try {
      await joinPublicTeam(userProfile, team.id, allChallenges);
      sound.playSuccess();
      onNotice(`Welcome to [${team.tag}] ${team.name}! All challenges combined.`);
    } catch (err: unknown) {
      sound.playError();
      const msg = err instanceof Error ? err.message : 'Failed to join team.';
      onNotice(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Leave Team
  const handleLeaveTeam = async () => {
    if (!userProfile || !userTeam) return;

    sound.playClick();
    setIsLeaving(true);
    try {
      await leaveTeam(userProfile, userTeam, [], allChallenges);
      sound.playSuccess();
      onNotice(`You have departed team [${userTeam.tag}] ${userTeam.name}.`);
      setShowConfirmLeave(false);
    } catch (err: unknown) {
      sound.playError();
      const msg = err instanceof Error ? err.message : 'Error leaving team.';
      onNotice(msg);
    } finally {
      setIsLeaving(false);
    }
  };

  // Handle Regenerate Invite Code (Captain only)
  const handleRegenerateCode = async () => {
    if (!userTeam) return;
    sound.playClick();
    try {
      const newCode = await regenerateInviteCode(userTeam.id, userTeam.tag);
      sound.playSuccess();
      onNotice(`New invite code generated: ${newCode}`);
    } catch {
      sound.playError();
      onNotice('Failed to regenerate invite code.');
    }
  };

  // Compute team rank on leaderboard
  const teamRank = userTeam
    ? teamsLeaderboard.findIndex(t => t.id === userTeam.id) + 1 || 1
    : null;

  // Unauthenticated view
  if (!userProfile) {
    return (
      <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl space-y-6 shadow-xl max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Users className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">CTF Squads & Team Hub</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Form a team with other security researchers, share unique challenge solves, and climb the live CTF leaderboard with combined scores.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenAuth();
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign In to Create or Join a Team</span>
          </button>
        </div>
      </div>
    );
  }

  // View when user IS in a Team
  if (userTeam) {
    const isCaptain = userProfile.uid === userTeam.captainId;

    return (
      <div className="space-y-6">
        {/* Team Banner / Command Center */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  [{userTeam.tag}]
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Captain: <strong className="text-slate-200">{userTeam.captainName}</strong>
                </span>
                {isCaptain && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    YOU ARE CAPTAIN
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>{userTeam.name}</span>
                <span className="text-xs font-mono font-normal text-slate-400 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                  {userTeam.memberIds.length} {userTeam.memberIds.length === 1 ? 'Operative' : 'Operatives'}
                </span>
              </h1>

              <p className="text-xs text-slate-400 max-w-xl">
                {userTeam.description || 'Competing collectively in the CyberStrike CTF Arena.'}
              </p>
            </div>

            {/* Score & Rank Badges */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center min-w-[90px]">
                <div className="text-slate-500 text-[10px] uppercase">Team Score</div>
                <div className="text-emerald-400 font-bold text-lg tabular-nums">
                  {userTeam.score.toLocaleString()} pts
                </div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center min-w-[80px]">
                <div className="text-slate-500 text-[10px] uppercase">Combined Solves</div>
                <div className="text-slate-100 font-bold text-lg tabular-nums">
                  {userTeam.solvesCount} / {allChallenges.length}
                </div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center min-w-[70px]">
                <div className="text-slate-500 text-[10px] uppercase">Rank</div>
                <div className="text-amber-400 font-bold text-lg tabular-nums">
                  #{teamRank || 1}
                </div>
              </div>
            </div>
          </div>

          {/* Invitation Card */}
          <div className="p-4 bg-slate-900/90 border border-indigo-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <span>Team Invitation Code:</span>
                  <span className="font-mono text-cyan-300 font-extrabold text-sm tracking-widest bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    {userTeam.inviteCode}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Share this code with other players to immediately combine their solves and aggregate scores on the leaderboard.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyInviteCode(userTeam.inviteCode)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>

              {isCaptain && (
                <button
                  onClick={handleRegenerateCode}
                  title="Generate new invitation code"
                  className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Power Distribution Matrix */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>TEAM DOMAIN SOLVE MATRIX (AGGREGATE POINTS)</span>
              <span className="text-emerald-400">{userTeam.solvesCount} unique challenges captured</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {Object.entries(userTeam.categoryBreakdown || {}).map(([cat, pts]) => (
                <div key={cat} className="p-2.5 bg-slate-900 border border-slate-800 rounded flex justify-between items-center">
                  <span className="text-slate-400">{cat}:</span>
                  <span className="font-bold text-slate-100 tabular-nums">{pts} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combined Challenges Solved by Team */}
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Collective Challenge Captures ({userTeam.solvedChallengeIds?.length || 0} / {allChallenges.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Any challenge solved by any member automatically unlocks credit and adds points to the team aggregate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
            {allChallenges.map(ch => {
              const isSolvedByTeam = userTeam.solvedChallengeIds?.includes(ch.id);
              const isSolvedByYou = userProfile.solvedChallengeIds?.includes(ch.id);

              return (
                <div
                  key={ch.id}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                    isSolvedByTeam
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-sans font-bold text-slate-200 truncate">{ch.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {ch.category} · {ch.difficulty} · {ch.points} pts
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isSolvedByTeam ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {isSolvedByYou ? 'YOU' : 'SQUAD'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">UNSOLVED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Actions & Departure */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            {isCaptain
              ? 'As Captain, leaving will promote the next active operative or disband the squad if empty.'
              : 'Leaving will deduct your unique challenge solves from the team aggregate.'}
          </div>

          {!showConfirmLeave ? (
            <button
              onClick={() => {
                sound.playClick();
                setShowConfirmLeave(true);
              }}
              className="px-3.5 py-1.5 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors font-semibold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Team</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold">Are you sure?</span>
              <button
                onClick={handleLeaveTeam}
                disabled={isLeaving}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-colors"
              >
                {isLeaving ? 'Leaving...' : 'Yes, Leave'}
              </button>
              <button
                onClick={() => setShowConfirmLeave(false)}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View when user does NOT have a Team yet
  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Team Formation & Recruitment</span>
            </h1>
            <p className="text-xs text-slate-400">
              Join forces with other hackers. When you join or create a team, all members' solved challenges merge into one powerhouse squad score.
            </p>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <button
              onClick={() => {
                sound.playClick();
                setActiveSubTab('create');
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'create'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Team
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveSubTab('join');
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'join'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Join by Code
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveSubTab('directory');
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'directory'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team Directory ({allTeams.length})
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: CREATE TEAM */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Found a New CTF Squad</span>
              </h2>
              <p className="text-xs text-slate-400">
                You will become the squad captain. Your current solves ({userProfile.solvesCount} challenges, {userProfile.score} pts) will automatically seed the team's initial score.
              </p>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-300 font-medium">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="e.g. ZeroDay Phantoms"
                    maxLength={50}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Squad Tag (2-6 Chars)</label>
                  <input
                    type="text"
                    value={teamTag}
                    onChange={e => setTeamTag(e.target.value.toUpperCase())}
                    placeholder="e.g. ZDP"
                    maxLength={6}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Mission Briefing / Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell potential recruits your focus domains and playstyle..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
                <input
                  type="checkbox"
                  id="openRecruit"
                  checked={isOpenRecruitment}
                  onChange={e => setIsOpenRecruitment(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="openRecruit" className="text-slate-300 cursor-pointer select-none">
                  <strong className="block text-slate-200">Public Recruitment Open</strong>
                  <span className="text-[11px] text-slate-400">Allow other players to discover and join your team from the directory.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Crown className="w-4 h-4" />
                <span>{isSubmitting ? 'Establishing Squad...' : 'Found Team & Generate Invite Code'}</span>
              </button>
            </form>
          </div>

          {/* Seed Benefits Card */}
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>How Aggregation Works</span>
            </h3>

            <div className="space-y-3 text-slate-400 leading-relaxed">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                <div className="font-semibold text-slate-200 mb-1">⚡ Combined Solves</div>
                <div>When multiple teammates solve the same challenge, the team receives full points once, avoiding duplicate penalty.</div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                <div className="font-semibold text-slate-200 mb-1">🏆 Unified Leaderboard Rank</div>
                <div>Your squad will immediately compete as a unit on the global CTF scoreboard with collective points.</div>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                <div className="font-semibold text-slate-200 mb-1">🔗 Easy Squad Invites</div>
                <div>Invite teammates with a simple 6-digit code or share link.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: JOIN BY INVITE CODE */}
      {activeSubTab === 'join' && (
        <div className="max-w-xl mx-auto p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-5 shadow-xl text-xs">
          <div className="space-y-1 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-100">Join a Team with Invitation Code</h2>
            <p className="text-slate-400">
              Enter the invite code given to you by a squad captain (e.g. <span className="font-mono text-cyan-300">CYBR-7X9B</span>).
            </p>
          </div>

          <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-slate-300 font-medium">Team Invitation Code</label>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SQUAD-ABC12"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm tracking-widest text-center uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying & Joining...' : 'Verify Code & Join Squad'}</span>
            </button>
          </form>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-[11px] text-slate-400 text-center">
            Tip: Joining will instantly aggregate all your captured flags with the squad's total score!
          </div>
        </div>
      )}

      {/* Sub-Tab 3: TEAM DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Discover public squads actively recruiting operatives:</span>
            <span>{allTeams.length} registered squads</span>
          </div>

          {allTeams.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <div>No public teams found yet. Be the first to establish a squad!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTeams.map(team => (
                <div
                  key={team.id}
                  className="p-5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 flex flex-col justify-between transition-colors shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                        [{team.tag}]
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {team.memberIds.length} members
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100">{team.name}</h3>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {team.description || 'Competing in the CyberStrike CTF Arena.'}
                    </p>

                    <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-900">
                      <span className="text-slate-500">Score:</span>
                      <span className="font-bold text-emerald-400">{team.score.toLocaleString()} pts</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Solves:</span>
                      <span className="font-bold text-slate-300">{team.solvesCount} targets</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {team.isOpen ? (
                      <button
                        onClick={() => handleJoinPublic(team)}
                        disabled={isSubmitting}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Join Squad</span>
                      </button>
                    ) : (
                      <div className="text-center text-[11px] font-mono text-slate-500 py-1 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Invite Code Required</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
