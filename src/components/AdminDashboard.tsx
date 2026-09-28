import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Flag,
  HelpCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Zap,
  Clock,
  Flame,
  Calendar,
  Award
} from 'lucide-react';
import { Challenge, Category, Difficulty } from '../types/ctf';
import { createChallenge, updateChallenge, deleteChallenge } from '../services/challengeService';
import { forceRotateDailyChallenge, getUtcDateString } from '../services/dailyChallengeService';
import { DAILY_CHALLENGES_POOL } from '../data/dailyChallenges';
import { sound } from '../utils/audio';

interface Props {
  challenges: Challenge[];
  onRefresh?: () => void;
}

const CATEGORIES: Category[] = ['Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'];
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Insane'];

export const AdminDashboard: React.FC<Props> = ({ challenges, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<'All' | Category>('All');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    category: Category;
    difficulty: Difficulty;
    points: number;
    author: string;
    flag: string;
    description: string;
    tags: string;
    hint1Text: string;
    hint1Cost: number;
    hint2Text: string;
    hint2Cost: number;
    writeup: string;
    isDaily: boolean;
    dailyBonusPoints: number;
  }>({
    id: '',
    title: '',
    category: 'Web',
    difficulty: 'Medium',
    points: 200,
    author: 'AdminOps',
    flag: 'flag{example_flag_123}',
    description: '',
    tags: 'Web, Security',
    hint1Text: '',
    hint1Cost: 15,
    hint2Text: '',
    hint2Cost: 30,
    writeup: '',
    isDaily: false,
    dailyBonusPoints: 100
  });

  const handleRotateDaily = async (targetId?: string) => {
    sound.playClick();
    setIsRotating(true);
    try {
      await forceRotateDailyChallenge(targetId);
      sound.playSuccess();
      setFeedback({
        type: 'success',
        text: 'Daily Challenge rotated successfully! All players now receive updated daily streak bonuses.'
      });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      sound.playError();
      setFeedback({ type: 'error', text: (err as Error).message || 'Failed to rotate daily challenge.' });
    } finally {
      setIsRotating(false);
    }
  };

  const openCreateModal = () => {
    sound.playClick();
    const newId = `custom-ch-${Date.now().toString(36)}`;
    setEditingChallenge(null);
    setFormData({
      id: newId,
      title: '',
      category: 'Web',
      difficulty: 'Easy',
      points: 100,
      author: 'CTF_Architect',
      flag: 'flag{my_custom_secret_flag}',
      description: 'Detailed instructions and scenario for this challenge...',
      tags: 'Web, Exploit',
      hint1Text: 'Inspect the HTTP request headers.',
      hint1Cost: 10,
      hint2Text: 'Notice the missing input validation.',
      hint2Cost: 20,
      writeup: 'Detailed walkthrough of the vulnerability root cause.',
      isDaily: false,
      dailyBonusPoints: 100
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ch: Challenge) => {
    sound.playClick();
    setEditingChallenge(ch);
    setFormData({
      id: ch.id,
      title: ch.title,
      category: ch.category,
      difficulty: ch.difficulty,
      points: ch.points,
      author: ch.author,
      flag: ch.flag,
      description: ch.description,
      tags: ch.tags.join(', '),
      hint1Text: ch.hints[0]?.text || '',
      hint1Cost: ch.hints[0]?.cost || 10,
      hint2Text: ch.hints[1]?.text || '',
      hint2Cost: ch.hints[1]?.cost || 20,
      writeup: ch.writeup || '',
      isDaily: Boolean(ch.isDaily),
      dailyBonusPoints: ch.dailyBonusPoints || 100
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    sound.playClick();
    try {
      await deleteChallenge(id);
      sound.playSuccess();
      setFeedback({ type: 'success', text: `Challenge "${id}" deleted successfully.` });
      setConfirmDeleteId(null);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      sound.playError();
      setFeedback({ type: 'error', text: (err as Error).message || 'Delete operation failed.' });
    }
  };

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setSubmitting(true);

    if (!formData.title.trim()) {
      setFeedback({ type: 'error', text: 'Challenge title is required.' });
      setSubmitting(false);
      return;
    }
    if (!formData.flag.trim()) {
      setFeedback({ type: 'error', text: 'Flag string is required.' });
      setSubmitting(false);
      return;
    }

    const hints = [];
    if (formData.hint1Text.trim()) {
      hints.push({
        id: `${formData.id}-h1`,
        text: formData.hint1Text.trim(),
        cost: Number(formData.hint1Cost) || 10
      });
    }
    if (formData.hint2Text.trim()) {
      hints.push({
        id: `${formData.id}-h2`,
        text: formData.hint2Text.trim(),
        cost: Number(formData.hint2Cost) || 20
      });
    }

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      if (editingChallenge) {
        // Update
        await updateChallenge(editingChallenge.id, {
          title: formData.title.trim(),
          category: formData.category,
          difficulty: formData.difficulty,
          points: Number(formData.points) || 100,
          author: formData.author.trim() || 'Admin',
          flag: formData.flag.trim(),
          description: formData.description.trim(),
          tags: tagsArray,
          hints,
          writeup: formData.writeup.trim(),
          isDaily: formData.isDaily,
          dailyBonusPoints: formData.isDaily ? Number(formData.dailyBonusPoints) || 100 : undefined,
          dailyDate: formData.isDaily ? getUtcDateString() : undefined
        });
        setFeedback({ type: 'success', text: `Challenge "${formData.title}" updated successfully.` });
      } else {
        // Create
        await createChallenge({
          id: formData.id,
          title: formData.title.trim(),
          category: formData.category,
          difficulty: formData.difficulty,
          points: Number(formData.points) || 100,
          author: formData.author.trim() || 'Admin',
          flag: formData.flag.trim(),
          description: formData.description.trim(),
          tags: tagsArray,
          hints,
          writeup: formData.writeup.trim(),
          isDaily: formData.isDaily,
          dailyBonusPoints: formData.isDaily ? Number(formData.dailyBonusPoints) || 100 : undefined,
          dailyDate: formData.isDaily ? getUtcDateString() : undefined
        });
        setFeedback({ type: 'success', text: `New challenge "${formData.title}" created in live database.` });
      }

      sound.playSuccess();
      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      sound.playError();
      setFeedback({ type: 'error', text: (err as Error).message || 'Failed to save challenge.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = challenges.filter(c => {
    const matchCat = filterCat === 'All' || c.category === filterCat;
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.author.toLowerCase().includes(search.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-slate-950 border border-amber-500/30 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Administrative CTF Command Center</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ROOT
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Create, update, and manage competitive challenges. All modifications synchronize live across all players in Firestore.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Challenge</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Daily Operations Control Card */}
      <div className="p-5 bg-slate-950 border border-amber-500/30 rounded-xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Automated Daily Operations Engine</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  UTC ROTATION
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                A new challenge unlocks daily with +100 bonus streak points. Admins can manually force-rotate or designate any target as today's active Daily Op.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRotateDaily()}
              disabled={isRotating}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
              <span>Rotate Next Daily Op</span>
            </button>
          </div>
        </div>

        {/* Daily Pool Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900 text-xs font-mono">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-slate-500 text-[10px] uppercase">Daily Pool Depth</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">
              {DAILY_CHALLENGES_POOL.length} Challenges Ready
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-slate-500 text-[10px] uppercase">Daily Streak Reward</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>+100 PTS + Streak Multiplier</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="text-slate-500 text-[10px] uppercase">Designate Daily Op</div>
            <select
              onChange={e => {
                if (e.target.value) {
                  handleRotateDaily(e.target.value);
                }
              }}
              defaultValue=""
              className="w-full mt-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="" disabled>Select challenge to set as Daily Op...</option>
              {challenges.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.category} · {c.points}pts)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-xs">
          {(['All', 'Web', 'Crypto', 'Reverse', 'Forensics', 'Pwn'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setFilterCat(cat);
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                filterCat === cat
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search challenges by title, author..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Challenges Management Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
            Active Challenges ({filtered.length})
          </div>
          <span className="text-[11px] font-mono text-slate-500">Live Database Synced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Title & ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4 text-center">Points</th>
                <th className="py-3 px-4 text-center">Solves</th>
                <th className="py-3 px-4">Secret Flag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {filtered.map(ch => {
                const isConfirmingDelete = confirmDeleteId === ch.id;

                return (
                  <tr key={ch.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span>{ch.title}</span>
                        {ch.isDaily && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 font-bold">
                            <Zap className="w-2.5 h-2.5 fill-amber-400" />
                            DAILY (+{ch.dailyBonusPoints || 100})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{ch.id} · @{ch.author}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        {ch.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`text-xs font-medium ${
                          ch.difficulty === 'Easy'
                            ? 'text-emerald-300'
                            : ch.difficulty === 'Medium'
                            ? 'text-amber-300'
                            : ch.difficulty === 'Hard'
                            ? 'text-rose-300'
                            : 'text-purple-300 font-bold'
                        }`}
                      >
                        {ch.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-100 tabular-nums">
                      {ch.points}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-400">
                      {ch.solvesCount}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-amber-300/90 font-mono max-w-xs truncate">
                      {ch.flag}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {isConfirmingDelete ? (
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            onClick={() => handleDelete(ch.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(ch)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Edit Challenge"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              sound.playClick();
                              setConfirmDeleteId(ch.id);
                            }}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Challenge"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create / Edit Challenge */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                  {editingChallenge ? `Edit Challenge: ${editingChallenge.title}` : 'Design New CTF Challenge'}
                </h3>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setIsModalOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveChallenge} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Challenge Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Rogue Memory Leak"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Internal Identifier (ID)</label>
                  <input
                    type="text"
                    disabled={!!editingChallenge}
                    value={formData.id}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-400 font-mono text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Difficulty Level</label>
                  <select
                    value={formData.difficulty}
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Reward Points</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    step={10}
                    value={formData.points}
                    onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-medium">Author / Architect Handle</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-emerald-400 font-medium">Official Secret Flag String</label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={e => setFormData({ ...formData, flag: e.target.value })}
                    placeholder="flag{...}"
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-600/50 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Description & Mission Briefing</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Provide context, mission objectives, target endpoints, or intercepted artifacts..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. SQLi, Authentication, SQLite"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Daily Challenge Designation Toggle */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDaily}
                    onChange={e => setFormData({ ...formData, isDaily: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Feature as Daily Challenge (Eligible for Daily Streak Rewards)</span>
                  </span>
                </label>

                {formData.isDaily && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Streak Bonus:</span>
                    <input
                      type="number"
                      value={formData.dailyBonusPoints}
                      onChange={e => setFormData({ ...formData, dailyBonusPoints: Number(e.target.value) })}
                      min={0}
                      max={500}
                      className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 text-xs font-mono"
                    />
                    <span className="text-slate-500">pts</span>
                  </div>
                )}
              </div>

              {/* Hints */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                  Configured Hints (Cost Deductions)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={formData.hint1Text}
                    onChange={e => setFormData({ ...formData, hint1Text: e.target.value })}
                    placeholder="Hint 1 text..."
                    className="sm:col-span-3 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-sans"
                  />
                  <input
                    type="number"
                    value={formData.hint1Cost}
                    onChange={e => setFormData({ ...formData, hint1Cost: Number(e.target.value) })}
                    placeholder="Penalty pts"
                    className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={formData.hint2Text}
                    onChange={e => setFormData({ ...formData, hint2Text: e.target.value })}
                    placeholder="Hint 2 text..."
                    className="sm:col-span-3 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-sans"
                  />
                  <input
                    type="number"
                    value={formData.hint2Cost}
                    onChange={e => setFormData({ ...formData, hint2Cost: Number(e.target.value) })}
                    placeholder="Penalty pts"
                    className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Writeup */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-medium">Declassified Solution Writeup</label>
                <textarea
                  value={formData.writeup}
                  onChange={e => setFormData({ ...formData, writeup: e.target.value })}
                  rows={3}
                  placeholder="Explain the technical vulnerability and solution steps (unlocked once solved)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-sans text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving to Cloud...' : editingChallenge ? 'Update Challenge' : 'Publish Challenge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
