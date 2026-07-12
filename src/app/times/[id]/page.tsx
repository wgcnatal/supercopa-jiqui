import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/MatchCard';
import { Match, Team, Player } from '@/lib/types';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

const positionOrder: Record<string, number> = {
  GOL: 1,
  ZAG: 2,
  LAT: 3,
  VOL: 4,
  MEI: 5,
  ATA: 6,
};

const positionLabels: Record<string, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  VOL: 'Volante',
  MEI: 'Meia',
  ATA: 'Atacante',
};

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: team }, { data: players }, { data: matches }] = await Promise.all([
    supabase.from('teams').select('*').eq('id', params.id).single(),
    supabase
      .from('players')
      .select('*')
      .eq('team_id', params.id)
      .order('position')
      .order('shirt_number'),
    supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
      .or(`home_team_id.eq.${params.id},away_team_id.eq.${params.id}`)
      .order('match_date', { ascending: true }),
  ]);

  if (!team) notFound();

  const teamData = team as Team;
  const roster = (players || []) as Player[];
  const teamMatches = (matches || []) as Match[];

  roster.sort(
    (a, b) =>
      (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99)
  );

  // Stats
  const finishedMatches = teamMatches.filter((m) => m.status === 'finished');
  let wins = 0,
    draws = 0,
    losses = 0,
    goalsFor = 0,
    goalsAgainst = 0;

  finishedMatches.forEach((m) => {
    const isHome = m.home_team_id === params.id;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > ga) wins++;
    else if (gf === ga) draws++;
    else losses++;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/times"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para times
      </Link>

      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: teamData.color }}
          >
            {(teamData.short_name || teamData.name).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {teamData.name}
            </h1>
            {teamData.short_name && (
              <p className="text-gray-400">{teamData.short_name}</p>
            )}
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-6">
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gold">
              {wins * 3 + draws}
            </p>
            <p className="text-xs text-gray-400">Pontos</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-gray-400">Vitorias</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-300">{draws}</p>
            <p className="text-xs text-gray-400">Empates</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{losses}</p>
            <p className="text-xs text-gray-400">Derrotas</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary-light">{goalsFor}</p>
            <p className="text-xs text-gray-400">Gols Pro</p>
          </div>
          <div className="bg-surface rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{goalsAgainst}</p>
            <p className="text-xs text-gray-400">Gols Contra</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roster */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Elenco</h2>
          {roster.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-gray-400">Nenhum jogador no elenco.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Jogador
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Posição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((player) => (
                    <tr
                      key={player.id}
                      className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {player.shirt_number || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-white font-medium">
                            {player.nickname || player.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge bg-primary/20 text-primary-light">
                          {positionLabels[player.position] || player.position}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Matches */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Jogos</h2>
          {teamMatches.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-gray-400">Nenhum jogo agendado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
