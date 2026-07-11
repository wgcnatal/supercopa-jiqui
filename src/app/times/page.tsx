import { createClient } from '@/lib/supabase/server';
import { Team } from '@/lib/types';
import { Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 60;

export const metadata = {
  title: 'Times - Supercopa Jiqui 2026',
};

export default async function TimesPage() {
  const supabase = createClient();

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  const allTeams = (teams || []) as Team[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title">Times</h1>

      {allTeams.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Nenhum time cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTeams.map((team) => (
            <Link
              key={team.id}
              href={`/times/${team.id}`}
              className="card-hover p-6 group"
            >
              <div className="flex items-center gap-4 mb-4">
                {team.logo_url ? (
                  <Image
                    src={team.logo_url}
                    alt={team.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: team.color }}
                  >
                    {(team.short_name || team.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors">
                    {team.name}
                  </h3>
                  {team.short_name && (
                    <p className="text-sm text-gray-400">{team.short_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>Ver elenco e jogos</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
