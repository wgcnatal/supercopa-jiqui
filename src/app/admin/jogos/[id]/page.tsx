import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { EditMatchForm } from './_components/EditMatchForm';

export const metadata = {
  title: 'Editar Jogo - Supercopa Jiqui 2026',
};

export default async function AdminEditMatchPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [{ data: match }, { data: goals }, { data: cards }, { data: players }] =
    await Promise.all([
      supabase
        .from('matches')
        .select(
          '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'
        )
        .eq('id', params.id)
        .single(),
      supabase
        .from('goals')
        .select('*, player:players(*)')
        .eq('match_id', params.id)
        .order('minute'),
      supabase
        .from('cards')
        .select('*, player:players(*)')
        .eq('match_id', params.id)
        .order('minute'),
      supabase.from('players').select('*').order('nickname'),
    ]);

  if (!match) notFound();

  // Filter players that belong to either team
  const matchPlayers = (players || []).filter(
    (p) =>
      p.team_id === match.home_team_id || p.team_id === match.away_team_id
  );

  return (
    <div>
      <Link
        href="/admin/jogos"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gold transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para jogos
      </Link>

      <EditMatchForm
        match={match}
        goals={goals || []}
        cards={cards || []}
        players={matchPlayers}
      />
    </div>
  );
}
