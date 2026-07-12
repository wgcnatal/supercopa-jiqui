import { createClient } from '@/lib/supabase/server';
import { Match } from '@/lib/types';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { AdminCreateMatch } from './_components/CreateMatch';

export const metadata = {
  title: 'Admin Jogos - Supercopa Jiqui 2026',
};

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    AGENDADO: 'badge-scheduled',
    EM_ANDAMENTO: 'badge-live',
    ENCERRADO: 'badge-finished',
  };
  const labels: Record<string, string> = {
    AGENDADO: 'Agendado',
    EM_ANDAMENTO: 'Ao Vivo',
    ENCERRADO: 'Encerrado',
  };
  return (
    <span className={classes[status] || 'badge-scheduled'}>
      {labels[status] || status}
    </span>
  );
}

export default async function AdminJogosPage() {
  const supabase = createClient();

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase
      .from('matches')
      .select(
        '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'
      )
      .order('played_at', { ascending: true }),
    supabase.from('teams').select('*').order('name'),
  ]);

  const allMatches = (matches || []) as Match[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Gerenciar Jogos</h2>
      </div>

      <AdminCreateMatch teams={teams || []} />

      {allMatches.length === 0 ? (
        <div className="card p-8 text-center mt-6">
          <p className="text-gray-400">Nenhum jogo cadastrado.</p>
        </div>
      ) : (
        <div className="card overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-light border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Mandante
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">
                    Placar
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Visitante
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">
                    Rodada
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {allMatches.map((match) => (
                  <tr
                    key={match.id}
                    className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: match.home_team?.color || '#666',
                          }}
                        />
                        <span className="text-white font-medium">
                          {match.home_team?.short_name ||
                            match.home_team?.name ||
                            '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-white font-bold">
                      {match.status !== 'AGENDADO'
                        ? `${match.home_score} x ${match.away_score}`
                        : '- x -'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: match.away_team?.color || '#666',
                          }}
                        />
                        <span className="text-white font-medium">
                          {match.away_team?.short_name ||
                            match.away_team?.name ||
                            '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-400">
                      {match.stage === 'GRUPO'
                        ? `R${match.round || '-'}`
                        : match.stage === 'SEMI'
                        ? 'Semi'
                        : match.stage === 'TERCEIRO'
                        ? '3º Lugar'
                        : 'Final'}
                    </td>
                    <td className="text-center py-3 px-4">
                      <StatusBadge status={match.status} />
                    </td>
                    <td className="text-center py-3 px-4">
                      <Link
                        href={`/admin/jogos/${match.id}`}
                        className="inline-flex items-center gap-1 text-gold hover:text-gold-light transition-colors text-sm"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
