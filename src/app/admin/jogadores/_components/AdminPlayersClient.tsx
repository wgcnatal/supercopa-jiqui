'use client';

import { useState, useMemo } from 'react';
import { Player, Team } from '@/lib/types';
import { Search } from 'lucide-react';

const positionLabels: Record<string, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  VOL: 'Volante',
  MEI: 'Meia',
  ATA: 'Atacante',
};

const paymentLabels: Record<string, string> = {
  PAGO: 'Pago',
  PENDENTE: 'Pendente',
  FREE: 'Free',
};

export function AdminPlayersClient({
  players,
  teams,
}: {
  players: Player[];
  teams: Team[];
}) {
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const teamsMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.full_name.toLowerCase().includes(searchLower) ||
        (p.nickname && p.nickname.toLowerCase().includes(searchLower));
      const matchesPosition = !filterPosition || p.position === filterPosition;
      const matchesTeam =
        !filterTeam ||
        (filterTeam === 'none' ? !p.team_id : p.team_id === filterTeam);
      const matchesPayment = !filterPayment || p.payment === filterPayment;
      return matchesSearch && matchesPosition && matchesTeam && matchesPayment;
    });
  }, [players, search, filterPosition, filterTeam, filterPayment]);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Jogadores</h2>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Buscar por nome..."
            />
          </div>
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="select-field w-auto"
          >
            <option value="">Todas posicoes</option>
            {Object.entries(positionLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="select-field w-auto"
          >
            <option value="">Todos os times</option>
            <option value="none">Sem time</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="select-field w-auto"
          >
            <option value="">Pagamento</option>
            {Object.entries(paymentLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-400 mb-4">
        {filtered.length} jogador{filtered.length !== 1 ? 'es' : ''} encontrado
        {filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-400">Nenhum jogador encontrado.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
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
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Time
                  </th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">
                    Pagamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((player) => {
                  const team = player.team_id
                    ? teamsMap.get(player.team_id)
                    : undefined;
                  return (
                    <tr
                      key={player.id}
                      className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400 font-mono">
                        {player.shirt_number || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">
                            {player.nickname || player.full_name}
                          </p>
                          {player.nickname && (
                            <p className="text-xs text-gray-500">
                              {player.full_name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge bg-primary/20 text-primary-light">
                          {positionLabels[player.position] || player.position}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {team ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                            <span className="text-gray-300">
                              {team.short_name || team.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span
                          className={`badge ${
                            player.payment === 'PAGO'
                              ? 'bg-green-900/30 text-green-400'
                              : player.payment === 'PENDENTE'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {paymentLabels[player.payment] || player.payment}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
