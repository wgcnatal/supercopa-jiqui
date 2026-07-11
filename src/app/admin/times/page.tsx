import { createClient } from '@/lib/supabase/server';
import { Team } from '@/lib/types';
import { AdminTeamsClient } from './_components/AdminTeamsClient';

export const metadata = {
  title: 'Admin Times - Supercopa Jiqui 2026',
};

export default async function AdminTimesPage() {
  const supabase = createClient();
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  return <AdminTeamsClient teams={(teams || []) as Team[]} />;
}
