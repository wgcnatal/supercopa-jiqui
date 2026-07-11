import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Player, Team } from '@/lib/types';
import { JogadoresClient } from './JogadoresClient';

export const revalidate = 0;

export const metadata = {
  title: 'Jogadores Inscritos - Supercopa Jiqui 2026',
};

export default async function JogadoresPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase.from('players').select('*').order('full_name'),
    supabase.from('teams').select('*').order('name'),
  ]);

  return (
    <JogadoresClient
      players={(players || []) as Player[]}
      teams={(teams || []) as Team[]}
      isAdmin={true}
    />
  );
}
