'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Match, Goal, Card, Player } from '@/lib/types';
import { Save, Plus, Trash2, Target, AlertTriangle } from 'lucide-react';

interface EditMatchFormProps {
  match: Match;
  goals: (Goal & { player?: Player })[];
  cards: (Card & { player?: Player })[];
  players: Player[];
}

export function EditMatchForm({
  match,
  goals: initialGoals,
  cards: initialCards,
  players,
}: EditMatchFormProps) {
  const [homeScore, setHomeScore] = useState(match.home_score);
  const [awayScore, setAwayScore] = useState(match.away_score);
  const [status, setStatus] = useState(match.status);
  const [matchDate, setMatchDate] = useState(
    match.match_date
      ? new Date(match.match_date).toISOString().slice(0, 16)
      : ''
  );
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState(initialGoals);
  const [cards, setCards] = useState(initialCards);

  // New goal form
  const [newGoalPlayer, setNewGoalPlayer] = useState('');
  const [newGoalMinute, setNewGoalMinute] = useState('');
  const [newGoalOwnGoal, setNewGoalOwnGoal] = useState(false);

  // New card form
  const [newCardPlayer, setNewCardPlayer] = useState('');
  const [newCardMinute, setNewCardMinute] = useState('');
  const [newCardType, setNewCardType] = useState<'YELLOW' | 'RED'>('YELLOW');

  const router = useRouter();
  const supabase = createClient();

  const homePlayers = players.filter(
    (p) => p.team_id === match.home_team_id
  );
  const awayPlayers = players.filter(
    (p) => p.team_id === match.away_team_id
  );

  async function handleSaveMatch() {
    setSaving(true);
    await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status,
        match_date: matchDate || null,
      })
      .eq('id', match.id);
    setSaving(false);
    router.refresh();
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalPlayer || !newGoalMinute) return;

    const { data } = await supabase
      .from('goals')
      .insert({
        match_id: match.id,
        player_id: newGoalPlayer,
        minute: parseInt(newGoalMinute),
        is_own_goal: newGoalOwnGoal,
      })
      .select('*, player:players(*)')
      .single();

    if (data) {
      setGoals([...goals, data]);
      setNewGoalPlayer('');
      setNewGoalMinute('');
      setNewGoalOwnGoal(false);
    }
  }

  async function handleDeleteGoal(goalId: string) {
    await supabase.from('goals').delete().eq('id', goalId);
    setGoals(goals.filter((g) => g.id !== goalId));
  }

  async function handleAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCardPlayer || !newCardMinute) return;

    const { data } = await supabase
      .from('cards')
      .insert({
        match_id: match.id,
        player_id: newCardPlayer,
        card_type: newCardType,
        minute: parseInt(newCardMinute),
      })
      .select('*, player:players(*)')
      .single();

    if (data) {
      setCards([...cards, data]);
      setNewCardPlayer('');
      setNewCardMinute('');
      setNewCardType('YELLOW');
    }
  }

  async function handleDeleteCard(cardId: string) {
    await supabase.from('cards').delete().eq('id', cardId);
    setCards(cards.filter((c) => c.id !== cardId));
  }

  return (
    <div className="space-y-8">
      {/* Match Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Dados do Jogo</h2>
          <span className="text-sm text-gray-400">
            {match.stage === 'group'
              ? `Rodada ${match.round}`
              : match.stage === 'semi'
              ? 'Semifinal'
              : 'Final'}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: match.home_team?.color || '#666' }}
            >
              {(
                match.home_team?.short_name || match.home_team?.name || '?'
              ).charAt(0)}
            </div>
            <p className="text-sm text-white font-medium">
              {match.home_team?.short_name || match.home_team?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
              className="input-field w-16 text-center text-2xl font-bold"
            />
            <span className="text-gray-500 text-xl">x</span>
            <input
              type="number"
              min={0}
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
              className="input-field w-16 text-center text-2xl font-bold"
            />
          </div>
          <div className="text-center">
            <div
              className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: match.away_team?.color || '#666' }}
            >
              {(
                match.away_team?.short_name || match.away_team?.name || '?'
              ).charAt(0)}
            </div>
            <p className="text-sm text-white font-medium">
              {match.away_team?.short_name || match.away_team?.name}
            </p>
          </div>
        </div>

        {/* Status & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'scheduled' | 'live' | 'finished')}
              className="select-field"
            >
              <option value="scheduled">Agendado</option>
              <option value="live">Ao Vivo</option>
              <option value="finished">Encerrado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Data/Hora
            </label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <button
          onClick={handleSaveMatch}
          disabled={saving}
          className="btn-gold flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Alteracoes'}
        </button>
      </div>

      {/* Goals */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-gold" />
          Gols
        </h2>

        {/* Existing goals */}
        {goals.length > 0 && (
          <div className="space-y-2 mb-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="flex items-center justify-between bg-surface rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-mono">
                    {goal.minute}&apos;
                  </span>
                  <span className="text-white">
                    {goal.player?.nickname || goal.player?.full_name || '-'}
                  </span>
                  {goal.is_own_goal && (
                    <span className="badge bg-red-900/30 text-red-400">
                      Gol Contra
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add goal form */}
        <form
          onSubmit={handleAddGoal}
          className="flex flex-wrap gap-3 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-300 mb-1">
              Jogador
            </label>
            <select
              value={newGoalPlayer}
              onChange={(e) => setNewGoalPlayer(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Selecione...</option>
              <optgroup label={match.home_team?.name || 'Mandante'}>
                {homePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.full_name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={match.away_team?.name || 'Visitante'}>
                {awayPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.full_name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-300 mb-1">
              Minuto
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={newGoalMinute}
              onChange={(e) => setNewGoalMinute(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 pb-2">
            <input
              type="checkbox"
              checked={newGoalOwnGoal}
              onChange={(e) => setNewGoalOwnGoal(e.target.checked)}
              className="rounded border-gray-600 bg-surface"
            />
            Gol Contra
          </label>
          <button type="submit" className="btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </form>
      </div>

      {/* Cards */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Cartões
        </h2>

        {/* Existing cards */}
        {cards.length > 0 && (
          <div className="space-y-2 mb-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between bg-surface rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-mono">
                    {card.minute}&apos;
                  </span>
                  <span
                    className={`inline-block w-4 h-5 rounded-sm ${
                      card.card_type === 'YELLOW'
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                    }`}
                  />
                  <span className="text-white">
                    {card.player?.nickname || card.player?.full_name || '-'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add card form */}
        <form
          onSubmit={handleAddCard}
          className="flex flex-wrap gap-3 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-300 mb-1">
              Jogador
            </label>
            <select
              value={newCardPlayer}
              onChange={(e) => setNewCardPlayer(e.target.value)}
              className="select-field"
              required
            >
              <option value="">Selecione...</option>
              <optgroup label={match.home_team?.name || 'Mandante'}>
                {homePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.full_name}
                  </option>
                ))}
              </optgroup>
              <optgroup label={match.away_team?.name || 'Visitante'}>
                {awayPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname || p.full_name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm text-gray-300 mb-1">
              Minuto
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={newCardMinute}
              onChange={(e) => setNewCardMinute(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="w-32">
            <label className="block text-sm text-gray-300 mb-1">Tipo</label>
            <select
              value={newCardType}
              onChange={(e) =>
                setNewCardType(e.target.value as 'YELLOW' | 'RED')
              }
              className="select-field"
            >
              <option value="YELLOW">Amarelo</option>
              <option value="RED">Vermelho</option>
            </select>
          </div>
          <button type="submit" className="btn-primary flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
