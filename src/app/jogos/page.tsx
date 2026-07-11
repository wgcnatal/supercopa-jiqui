import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/MatchCard';
import { Match } from '@/lib/types';

export const revalidate = 60;

export const metadata = {
  title: 'Jogos - Supercopa Jiqui 2026',
};

export default async function JogosPage() {
  const supabase = createClient();

  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .order('match_date', { ascending: true });

  const allMatches = (matches || []) as Match[];

  // Group by round for group stage
  const groupMatches = allMatches.filter((m) => m.stage === 'group');
  const semiMatches = allMatches.filter((m) => m.stage === 'semi');
  const finalMatches = allMatches.filter((m) => m.stage === 'final');

  const rounds: Record<number, Match[]> = {};
  groupMatches.forEach((m) => {
    const round = m.round || 1;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(m);
  });

  const roundNumbers = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title">Jogos</h1>

      {allMatches.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Nenhum jogo cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Group stage rounds */}
          {roundNumbers.map((round) => (
            <section key={round}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light text-sm font-bold">
                  {round}
                </span>
                Rodada {round}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rounds[round].map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}

          {/* Semifinals */}
          {semiMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gold mb-4">Semifinais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {semiMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* Final */}
          {finalMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gold mb-4">Final</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finalMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
