'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Team } from '@/lib/types';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

export function AdminCreateMatch({ teams }: { teams: Team[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [round, setRound] = useState('1');
  const [stage, setStage] = useState('GRUPO');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from('matches').insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      played_at: matchDate || null,
      round: stage === 'GRUPO' ? parseInt(round) : null,
      stage,
      status: 'AGENDADO',
      home_score: 0,
      away_score: 0,
    });

    if (!error) {
      setHomeTeamId('');
      setAwayTeamId('');
      setMatchDate('');
      setRound('1');
      setStage('GRUPO');
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="flex items-center gap-2 text-gold font-medium">
          <Plus className="w-4 h-4" />
          Criar novo jogo
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Time Mandante
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="select-field"
                required
              >
                <option value="">Selecione...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Time Visitante
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="select-field"
                required
              >
                <option value="">Selecione...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm text-gray-300 mb-1">Fase</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="select-field"
              >
                <option value="GRUPO">Fase de Grupos</option>
                <option value="SEMI">Semifinal</option>
                <option value="FINAL">Final</option>
                <option value="TERCEIRO">3º Lugar</option>
              </select>
            </div>
            {stage === 'GRUPO' && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Rodada
                </label>
                <select
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="select-field"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((r) => (
                    <option key={r} value={r}>
                      Rodada {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Criando...' : 'Criar Jogo'}
          </button>
        </form>
      )}
    </div>
  );
}
