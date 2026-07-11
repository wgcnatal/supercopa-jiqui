import { createClient } from '@/lib/supabase/server';
import { Goal, Card, Player, Team } from '@/lib/types';
import { Award, AlertTriangle } from 'lucide-react';

export const revalidate = 60;

export const metadata = {
  title: 'Estatisticas - Supercopa Jiqui 2026',
};

export default async function EstatisticasPage() {
  const supabase = createClient();

  const [{ data: goals }, { data: cards }, { data: teams }] =
    await Promise.all([
      supabase.from('goals').select('*, player:players(*)').eq('is_own_goal', false),
      supabase.from('cards').select('*, player:players(*)'),
      supabase.from('teams').select('*'),
    ]);

  const allGoals = (goals || []) as (Goal & { player: Player })[];
  const allCards = (cards || []) as (Card & { player: Player })[];
  const allTeams = (teams || []) as Team[];

  const teamsMap = new Map(allTeams.map((t) => [t.id, t]));

  // Top scorers
  const scorerMap = new Map<string, { player: Player; goals: number }>();
  allGoals.forEach((g) => {
    if (!g.player) return;
    const existing = scorerMap.get(g.player_id);
    if (existing) {
      existing.goals++;
    } else {
      scorerMap.set(g.player_id, { player: g.player, goals: 1 });
    }
  });
  const topScorers = Array.from(scorerMap.values())
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 20);

  // Card stats
  const cardMap = new Map<
    string,
    { player: Player; yellowCards: number; redCards: number }
  >();
  allCards.forEach((c) => {
    if (!c.player) return;
    const existing = cardMap.get(c.player_id);
    if (existing) {
      if (c.card_type === 'YELLOW') existing.yellowCards++;
      else existing.redCards++;
    } else {
      cardMap.set(c.player_id, {
        player: c.player,
        yellowCards: c.card_type === 'YELLOW' ? 1 : 0,
        redCards: c.card_type === 'RED' ? 1 : 0,
      });
    }
  });
  const cardStats = Array.from(cardMap.values())
    .sort((a, b) => {
      const totalA = a.yellowCards + a.redCards * 3;
      const totalB = b.yellowCards + b.redCards * 3;
      return totalB - totalA;
    })
    .slice(0, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title">Estatisticas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Scorers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-bold text-white">Artilharia</h2>
          </div>
          {topScorers.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Nenhum gol registrado ainda.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Jogador
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Time
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">
                      Gols
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topScorers.map((scorer, i) => {
                    const team = scorer.player.team_id
                      ? teamsMap.get(scorer.player.team_id)
                      : undefined;
                    return (
                      <tr
                        key={scorer.player.id}
                        className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 font-mono">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {scorer.player.nickname || scorer.player.full_name}
                        </td>
                        <td className="py-3 px-4">
                          {team && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="text-gray-300 text-xs">
                                {team.short_name || team.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="bg-gold/20 text-gold font-bold px-2 py-1 rounded">
                            {scorer.goals}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Card Stats */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Cartoes</h2>
          </div>
          {cardStats.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Nenhum cartao registrado ainda.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Jogador
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Time
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">
                      <span className="inline-block w-4 h-5 bg-yellow-400 rounded-sm" />
                    </th>
                    <th className="text-center py-3 px-4 text-gray-400 font-medium">
                      <span className="inline-block w-4 h-5 bg-red-500 rounded-sm" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cardStats.map((stat, i) => {
                    const team = stat.player.team_id
                      ? teamsMap.get(stat.player.team_id)
                      : undefined;
                    return (
                      <tr
                        key={stat.player.id}
                        className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-400 font-mono">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {stat.player.nickname || stat.player.full_name}
                        </td>
                        <td className="py-3 px-4">
                          {team && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="text-gray-300 text-xs">
                                {team.short_name || team.name}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="text-center py-3 px-4 text-yellow-400 font-bold">
                          {stat.yellowCards}
                        </td>
                        <td className="text-center py-3 px-4 text-red-400 font-bold">
                          {stat.redCards}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
