import { createClient } from '@/lib/supabase/server';
import { Player, Team } from '@/lib/types';
import { AdminPlayersClient } from './_components/AdminPlayersClient';

export const metadata = {
  title: 'Admin Jogadores - Supercopa Jiqui 2026',
};

export default async function AdminJogadoresPage() {
  const supabase = createClient();

  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase.from('players').select('*').order('full_name'),
    supabase.from('teams').select('*').order('name'),
  ]);

  return (
    <AdminPlayersClient
      players={(players || []) as Player[]}
      teams={(teams || []) as Team[]}
    />
  );
}
