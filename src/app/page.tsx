import { createClient } from '@/lib/supabase/server';
import { StandingsTable } from '@/components/StandingsTable';
import { MatchCard } from '@/components/MatchCard';
import { Match, Team } from '@/lib/types';
import { Trophy, Calendar, TrendingUp, Handshake } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const sponsors = [
  { name: 'Ortobom Midway', logo: '/sponsors/ortobom-midway.jpg' },
  { name: 'Consorcio Embracon', logo: '/sponsors/embracon.jpg' },
  { name: 'Super Locação e Construção', logo: '/sponsors/super-locacao.jpg' },
  { name: 'Piraque', logo: '/sponsors/piraque.jpg' },
  { name: 'Super Limp', logo: '/sponsors/super-limp.jpg' },
  { name: 'Autoescola Via Certa', logo: '/sponsors/via-certa.jpg' },
  { name: 'Cabeça Auto Center', logo: '/sponsors/cabeca-auto-center.jpg' },
  { name: 'WEB-TV Prof. Luis Carlos Noronha', logo: '/sponsors/luiscarlos-noronha.jpg' },
];

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: teams },
    { data: matches },
    { data: nextMatches },
  ] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('matches').select('*').order('played_at', { ascending: true }),
    supabase
      .from('matches')
      .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
      .in('status', ['AGENDADO', 'EM_ANDAMENTO'])
      .order('played_at', { ascending: true })
      .limit(4),
  ]);

  const allMatches = (matches || []) as Match[];
  const allTeams = (teams || []) as Team[];
  const upcoming = (nextMatches || []) as Match[];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-dark via-surface-dark to-surface overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,95,70,0.3),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,160,23,0.15),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="flex justify-center mb-6">
            <Trophy className="w-16 h-16 text-gold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            <span className="text-white">SUPERCOPA</span>{' '}
            <span className="gold-gradient">JIQUI</span>
          </h1>
          <p className="text-xl md:text-2xl text-gold font-bold mb-2">2026</p>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            7 times, 1 campeão. Acompanhe todos os jogos, classificação e estatísticas do torneio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/classificacao" className="btn-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Classificação
            </Link>
            <Link href="/jogos" className="btn-outline flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jogos
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Next matches */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Próximos Jogos</h2>
            <Link href="/jogos" className="text-sm text-gold hover:text-gold-light transition-colors">
              Ver todos
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-400">Nenhum jogo agendado no momento.</p>
            </div>
          )}
        </section>

        {/* Standings */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">Classificação</h2>
            <Link href="/classificacao" className="text-sm text-gold hover:text-gold-light transition-colors">
              Ver completa
            </Link>
          </div>
          <StandingsTable matches={allMatches} teams={allTeams} compact />
        </section>

        {/* Patrocinadores */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Handshake className="w-5 h-5 text-gold" />
            <h2 className="section-title mb-0">Patrocinadores</h2>
          </div>
          <div className="card p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.name}
                  className="bg-white rounded-xl p-4 flex items-center justify-center hover:scale-105 transition-transform aspect-[3/2]"
                >
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={120}
                    className="object-contain w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
