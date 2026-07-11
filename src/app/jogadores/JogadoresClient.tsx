'use client';

import { useState } from 'react';
import { Player, Position, PaymentStatus, Team } from '@/lib/types';
import { Users, Check, X, Pencil, Filter, Plus, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const POT_OPTIONS = ['', 'POTE 1', 'POTE 2', 'POTE 3', 'POTE 4', 'POTE 5'];

const positionLabels: Record<string, string> = {
  GOL: 'Goleiros',
  ZAG: 'Zagueiros',
  LAT: 'Laterais',
  MEI: 'Meias',
  ATA: 'Atacantes',
};

const positionOrder = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

const positionColors: Record<string, string> = {
  GOL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ZAG: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LAT: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEI: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ATA: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const paymentColors: Record<string, string> = {
  PAGO: 'bg-emerald-500/20 text-emerald-400',
  PENDENTE: 'bg-yellow-500/20 text-yellow-400',
  FREE: 'bg-cyan-500/20 text-cyan-400',
};

// No more static pot lookup - using player.pot from database

export function JogadoresClient({ players: initialPlayers, teams, isAdmin }: { players: Player[]; teams: Team[]; isAdmin: boolean }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState<Position>('GOL');
  const [editPayment, setEditPayment] = useState<PaymentStatus>('PAGO');
  const [editPot, setEditPot] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [filterPosition, setFilterPosition] = useState<string>('TODOS');
  const [filterPayment, setFilterPayment] = useState<string>('TODOS');
  const [filterTeam, setFilterTeam] = useState<string>('TODOS');
  const [filterPot, setFilterPot] = useState<string>('TODOS');

  const teamsMap = new Map(teams.map(t => [t.id, t]));

  const filtered = players.filter((p) => {
    if (filterPosition !== 'TODOS' && p.position !== filterPosition) return false;
    if (filterPayment !== 'TODOS' && p.payment !== filterPayment) return false;
    if (filterTeam !== 'TODOS') {
      if (filterTeam === 'SEM_TIME') {
        if (p.team_id) return false;
      } else {
        if (p.team_id !== filterTeam) return false;
      }
    }
    if (filterPot !== 'TODOS') {
      if (filterPot === 'SEM_POTE') {
        if (p.pot) return false;
      } else {
        if (p.pot !== filterPot) return false;
      }
    }
    return true;
  });

  const visiblePositions = filterPosition === 'TODOS' ? positionOrder : [filterPosition];

  const grouped = positionOrder.reduce((acc, pos) => {
    acc[pos] = filtered.filter((p) => p.position === pos);
    return acc;
  }, {} as Record<string, Player[]>);

  const totalPago = players.filter((p) => p.payment === 'PAGO').length;
  const totalPendente = players.filter((p) => p.payment === 'PENDENTE').length;
  const totalFree = players.filter((p) => p.payment === 'FREE').length;

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setEditPosition(player.position as Position);
    setEditPayment(player.payment as PaymentStatus);
    setEditPot(player.pot || '');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPosition('GOL');
    setEditPayment('PAGO');
    setEditPot('');
  };

  const handleSave = async (playerId: string) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('players')
      .update({ position: editPosition, payment: editPayment, pot: editPot || null })
      .eq('id', playerId);

    if (!error) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, position: editPosition, payment: editPayment, pot: editPot || null } : p))
      );
    }
    setSaving(false);
    setEditingId(null);
    setEditPosition('GOL');
    setEditPayment('PAGO');
    setEditPot('');
  };

  // Add player form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPosition, setNewPosition] = useState<Position>('MEI');
  const [newPayment, setNewPayment] = useState<PaymentStatus>('PENDENTE');
  const [addingSaving, setAddingSaving] = useState(false);

  const handleAddPlayer = async () => {
    if (!newName.trim()) return;
    setAddingSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('players')
      .insert({
        full_name: newName.trim(),
        nickname: newNickname.trim() || null,
        position: newPosition,
        payment: newPayment,
      })
      .select()
      .single();

    if (!error && data) {
      setPlayers((prev) => [...prev, data as Player].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setNewName('');
      setNewNickname('');
      setNewPosition('MEI');
      setNewPayment('PENDENTE');
      setShowAddForm(false);
    }
    setAddingSaving(false);
  };

  const hasActiveFilters = filterPosition !== 'TODOS' || filterPayment !== 'TODOS' || filterTeam !== 'TODOS' || filterPot !== 'TODOS';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-gold" />
          <h1 className="section-title mb-0">Jogadores Inscritos</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-gold text-sm flex items-center gap-1"
          >
            {showAddForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            Adicionar Jogador
          </button>
        )}
      </div>
      <p className="text-gray-400 mb-6">
        {players.length} jogadores inscritos no Campeonato Jiqui Country Club 2026
      </p>

      {/* Formulário de adicionar jogador */}
      {showAddForm && (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Novo Jogador</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome Completo *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome completo"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Apelido</label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Apelido (opcional)"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Posicao</label>
              <select
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value as Position)}
                className="input-field text-sm"
              >
                {positionOrder.map((p) => (
                  <option key={p} value={p}>{p} - {positionLabels[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={newPayment}
                onChange={(e) => setNewPayment(e.target.value as PaymentStatus)}
                className="input-field text-sm"
              >
                <option value="PAGO">PAGO</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="FREE">FREE</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddPlayer}
                disabled={!newName.trim() || addingSaving}
                className="btn-primary text-sm w-full flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {addingSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-4 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-gray-300">Filtros</span>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterPosition('TODOS'); setFilterPayment('TODOS'); setFilterTeam('TODOS'); setFilterPot('TODOS'); }}
              className="text-xs text-red-400 hover:text-red-300 ml-auto"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Posicao</label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterPosition('TODOS')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterPosition === 'TODOS'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              {positionOrder.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(filterPosition === pos ? 'TODOS' : pos)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
                    filterPosition === pos
                      ? positionColors[pos]
                      : 'bg-surface-light text-gray-400 border-gray-700/50 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterPayment('TODOS')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterPayment === 'TODOS'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              {['PAGO', 'PENDENTE', 'FREE'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterPayment(filterPayment === status ? 'TODOS' : status)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    filterPayment === status
                      ? paymentColors[status]
                      : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Equipe</label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterTeam('TODOS')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterTeam === 'TODOS'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterTeam(filterTeam === 'SEM_TIME' ? 'TODOS' : 'SEM_TIME')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterTeam === 'SEM_TIME'
                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Sem time
              </button>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setFilterTeam(filterTeam === team.id ? 'TODOS' : team.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterTeam === team.id
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                  }`}
                >
                  {team.logo_url ? (
                    <Image src={team.logo_url} alt={team.name} width={16} height={16} className="w-4 h-4 object-contain" />
                  ) : (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                  )}
                  {team.short_name || team.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Pote</label>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterPot('TODOS')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterPot === 'TODOS'
                    ? 'bg-gold/20 text-gold border border-gold/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterPot(filterPot === 'SEM_POTE' ? 'TODOS' : 'SEM_POTE')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  filterPot === 'SEM_POTE'
                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                }`}
              >
                Sem pote
              </button>
              {POT_OPTIONS.filter(p => p).map((potName) => (
                <button
                  key={potName}
                  onClick={() => setFilterPot(filterPot === potName ? 'TODOS' : potName)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    filterPot === potName
                      ? 'bg-gold/15 text-gold border border-gold/20'
                      : 'bg-surface-light text-gray-400 border border-gray-700/50 hover:text-white'
                  }`}
                >
                  {potName}
                </button>
              ))}
            </div>
          </div>
        </div>
        {hasActiveFilters && (
          <p className="text-xs text-gray-500 mt-3">
            Exibindo <span className="text-white font-medium">{filtered.length}</span> de {players.length} jogadores
          </p>
        )}
      </div>

      {/* Resumo por posição */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {positionOrder.map((pos) => (
          <div key={pos} className="card p-4 text-center">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border mb-2 ${positionColors[pos]}`}>
              {pos}
            </span>
            <p className="text-2xl font-bold text-white">{grouped[pos].length}</p>
            <p className="text-xs text-gray-400">{positionLabels[pos]}</p>
          </div>
        ))}
      </div>

      {/* Status de pagamento */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{totalPago}</p>
          <p className="text-xs text-gray-400">Pagos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{totalPendente}</p>
          <p className="text-xs text-gray-400">Pendentes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalFree}</p>
          <p className="text-xs text-gray-400">Free</p>
        </div>
      </div>

      {/* Lista por posição */}
      <div className="space-y-8">
        {visiblePositions.filter((pos) => grouped[pos].length > 0).map((pos) => (
          <section key={pos}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded text-sm font-bold border ${positionColors[pos]}`}>
                {pos}
              </span>
              <h2 className="text-lg font-bold text-white">{positionLabels[pos]}</h2>
              <span className="text-gray-500 text-sm">({grouped[pos].length})</span>
            </div>
            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-light border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Nome</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">Posicao</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">Pote</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">Equipe</th>
                    <th className="text-center py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">Status</th>
                    {isAdmin && (
                      <th className="text-center py-3 px-3 text-gray-400 font-medium w-20">Acao</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {grouped[pos].map((player, i) => {
                    const team = player.team_id ? teamsMap.get(player.team_id) : null;

                    return (
                      <tr
                        key={player.id}
                        className="border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{i + 1}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-white">{player.full_name}</span>
                          {player.nickname && (
                            <span className="text-gray-400 text-xs ml-2">({player.nickname})</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3 hidden sm:table-cell">
                          {editingId === player.id ? (
                            <select
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value as Position)}
                              className="bg-surface-dark border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                            >
                              {positionOrder.map((p) => (
                                <option key={p} value={p}>{p} - {positionLabels[p]}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${positionColors[player.position]}`}>
                              {player.position}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3 hidden sm:table-cell">
                          {editingId === player.id ? (
                            <select
                              value={editPot}
                              onChange={(e) => setEditPot(e.target.value)}
                              className="bg-surface-dark border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                            >
                              <option value="">Sem pote</option>
                              {POT_OPTIONS.filter(p => p).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : player.pot ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gold/15 text-gold border border-gold/20">
                              {player.pot}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3 hidden sm:table-cell">
                          {team ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {team.logo_url ? (
                                <Image src={team.logo_url} alt={team.name} width={18} height={18} className="w-[18px] h-[18px] object-contain" />
                              ) : (
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                              )}
                              <span className="text-xs text-gray-300">{team.short_name || team.name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-3 hidden sm:table-cell">
                          {editingId === player.id ? (
                            <select
                              value={editPayment}
                              onChange={(e) => setEditPayment(e.target.value as PaymentStatus)}
                              className="bg-surface-dark border border-gray-600 rounded px-2 py-1 text-xs text-white focus:border-gold focus:outline-none"
                            >
                              <option value="PAGO">PAGO</option>
                              <option value="PENDENTE">PENDENTE</option>
                              <option value="FREE">FREE</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentColors[player.payment] || 'text-gray-400'}`}>
                              {player.payment}
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="text-center py-3 px-3">
                            {editingId === player.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleSave(player.id)}
                                  disabled={saving}
                                  className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50"
                                  title="Salvar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancel}
                                  className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(player)}
                                className="p-1 rounded hover:bg-gold/20 text-gray-400 hover:text-gold transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
