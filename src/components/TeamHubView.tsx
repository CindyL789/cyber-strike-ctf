import React, { useState } from 'react';
import { Users, UserPlus, Shield, Trophy, ArrowRight, Check } from 'lucide-react';
import { UserProfile, Challenge, TeamScore } from '../types/ctf';
import { createTeam, joinTeam } from '../services/authService';
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
  onOpenAuth,
  onNotice,
  teamsLeaderboard
}) => {
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!teamName.trim() || !teamTag.trim()) return;

    sound.playClick();
    setIsSubmitting(true);
    try {
      await createTeam(userProfile, teamName, teamTag);
      sound.playSuccess();
      onNotice(`Squad [${teamTag.toUpperCase()}] "${teamName}" created successfully!`);
      setTeamName('');
      setTeamTag('');
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to create squad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (teamId: string, name: string) => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    sound.playClick();
    try {
      await joinTeam(userProfile, teamId);
      sound.playSuccess();
      onNotice(`Joined squad "${name}"!`);
    } catch (err: unknown) {
      sound.playError();
      alert((err as Error).message || 'Failed to join squad.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
      {/* Current Team Status */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Tactical Strike Squads</h2>
              {userProfile?.teamTag && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  [{userProfile.teamTag}]
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {userProfile?.teamName
                ? `You are enlisted in squad "${userProfile.teamName}"`
                : 'Join or establish a tactical squad to aggregate challenge scores'}
            </p>
          </div>
        </div>

        {!userProfile && (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
          >
            Authenticate to Enlist
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Squad Form */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Establish New Squad</span>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px]">Squad Name:</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. ZeroDaySyndicate"
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px]">Squad Tag (2-5 letters):</label>
              <input
                type="text"
                maxLength={5}
                value={teamTag}
                onChange={e => setTeamTag(e.target.value.toUpperCase())}
                placeholder="e.g. ZDS"
                className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs font-mono uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
            >
              {isSubmitting ? 'Establishing...' : 'Commission Squad'}
            </button>
          </form>
        </div>

        {/* Existing Squads Roster */}
        <div className="lg:col-span-2 p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="font-bold text-white text-sm flex items-center justify-between">
            <span>Enlisted Squad Rosters</span>
            <span className="text-[11px] text-slate-400">{teamsLeaderboard.length} Squads Active</span>
          </div>

          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {teamsLeaderboard.map(team => {
              const isMyTeam = userProfile?.teamName === team.name;

              return (
                <div key={team.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                      {team.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {team.teamTag && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            [{team.teamTag}]
                          </span>
                        )}
                        <span>{team.name}</span>
                        {isMyTeam && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ENLISTED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{team.solves} solves · {team.score.toLocaleString()} pts</div>
                    </div>
                  </div>

                  {!isMyTeam && userProfile && (
                    <button
                      onClick={() => handleJoin(team.id, team.name)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded transition-colors"
                    >
                      Enlist
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
