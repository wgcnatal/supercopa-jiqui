import { createClient } from '@/lib/supabase/server';
import { StandingsTable } from '@/components/StandingsTable';
import { Match, Team } from '@/lib/types';

export const revalidate = 60;

export const metadata = {
  title: 'Classificacao - Supercopa Jiqui 2026',
};

export default async function ClassificacaoPage() {
  const supabase = createClient();

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('matches').select('*'),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title">Classificacao</h1>
      <StandingsTable
        matches={(matches || []) as Match[]}
        teams={(teams || []) as Team[]}
      />
    </div>
  );
}
