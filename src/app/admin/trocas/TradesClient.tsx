'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Team, Player, Trade } from '@/lib/types';
import { ArrowLeftRight, Gift, ChevronRight, Trash2, History } from 'lucide-react';
import Image from 'next/image';

function TeamLogo({ team, size = 20 }: { team: Team; size?: number }) {
  return team.logo_url ? (
    <Image src={team.logo_url} alt={team.name} width={size} height={size} className="object-contain flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex-shrink-0" style={{ backgroundColor: team.color, width: size, height: size }} />
  );
}

type TabType = 'troca' | 'cessao' | 'historico';

export default function TradesClient() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('troca');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Troca state
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');

  // Cessão state
  const [cederTeam, setCederTeam] = useState('');
  const [cederPlayer, setCederPlayer] = useState('');
  const [receberTeam, setReceberTeam] = useState('');
  const [cessaoNotes, setCessaoNotes] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const [{ data: teamsData }, { data: playersData }, { data: tradesData }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('players').select('*').order('nickname'),
      supabase
        .from('trades')
        .select('*, player:players(*), from_team:teams!from_team_id(*), to_team:teams!to_team_id(*)')
        .order('created_at', { ascending: false }),
    ]);
    setTeams(teamsData || []);
    setPlayers(playersData || []);
    setTrades(tradesData || []);
    setLoading(false);
  }

  function getTeamPlayers(teamId: string) {
    return players.filter(p => p.team_id === teamId);
  }

  function getTeamById(id: string) {
    return teams.find(t => t.id === id);
  }

  function getPlayerById(id: string) {
    return players.find(p => p.id === id);
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function executeTrade() {
    if (!teamA || !teamB || !playerA || !playerB) return;
    setSaving(true);

    try {
      // Update player A → team B
      const { error: err1 } = await supabase
        .from('players')
        .update({ team_id: teamB })
        .eq('id', playerA);

      // Update player B → team A
      const { error: err2 } = await supabase
        .from('players')
        .update({ team_id: teamA })
        .eq('id', playerB);

      if (err1 || err2) throw new Error('Erro ao atualizar jogadores');

      // Log trade A → B
      const { data: tradeAData } = await supabase.from('trades').insert({
        player_id: playerA,
        from_team_id: teamA,
        to_team_id: teamB,
        trade_type: 'TROCA',
        notes: tradeNotes || null,
      }).select().single();

      // Log trade B → A (linked)
      await supabase.from('trades').insert({
        player_id: playerB,
        from_team_id: teamB,
        to_team_id: teamA,
        trade_type: 'TROCA',
        linked_trade_id: tradeAData?.id || null,
        notes: tradeNotes || null,
      });

      // Update linked_trade_id on first trade
      if (tradeAData) {
        const { data: tradeBData } = await supabase
          .from('trades')
          .select('id')
          .eq('linked_trade_id', tradeAData.id)
          .single();
        if (tradeBData) {
          await supabase.from('trades').update({ linked_trade_id: tradeBData.id }).eq('id', tradeAData.id);
        }
      }

      setTeamA('');
      setTeamB('');
      setPlayerA('');
      setPlayerB('');
      setTradeNotes('');
      showMessage('success', 'Troca realizada com sucesso!');
      await loadData();
    } catch {
      showMessage('error', 'Erro ao realizar a troca. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function executeCessao() {
    if (!cederTeam || !cederPlayer || !receberTeam) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: receberTeam })
        .eq('id', cederPlayer);

      if (error) throw error;

      await supabase.from('trades').insert({
        player_id: cederPlayer,
        from_team_id: cederTeam,
        to_team_id: receberTeam,
        trade_type: 'CESSAO',
        notes: cessaoNotes || null,
      });

      setCederTeam('');
      setCederPlayer('');
      setReceberTeam('');
      setCessaoNotes('');
      showMessage('success', 'Cessão realizada com sucesso!');
      await loadData();
    } catch {
      showMessage('error', 'Erro ao realizar a cessão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteTrade(trade: Trade) {
    if (!confirm('Deseja desfazer esta operação? O jogador voltará ao time anterior.')) return;

    try {
      // Revert player
      await supabase
        .from('players')
        .update({ team_id: trade.from_team_id })
        .eq('id', trade.player_id);

      // If linked trade (troca), revert the other player too
      if (trade.linked_trade_id) {
        const { data: linkedTrade } = await supabase
          .from('trades')
          .select('*')
          .eq('id', trade.linked_trade_id)
          .single();

        if (linkedTrade) {
          await supabase
            .from('players')
            .update({ team_id: linkedTrade.from_team_id })
            .eq('id', linkedTrade.player_id);
          await supabase.from('trades').delete().eq('id', linkedTrade.id);
        }
      }

      // Also delete any trade that links to this one
      await supabase.from('trades').delete().eq('linked_trade_id', trade.id);

      // Delete this trade
      await supabase.from('trades').delete().eq('id', trade.id);

      showMessage('success', 'Operação desfeita com sucesso!');
      await loadData();
    } catch {
      showMessage('error', 'Erro ao desfazer a operação.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const teamAPlayers = teamA ? getTeamPlayers(teamA) : [];
  const teamBPlayers = teamB ? getTeamPlayers(teamB) : [];
  const cederTeamPlayers = cederTeam ? getTeamPlayers(cederTeam) : [];

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'troca', label: 'Troca', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { key: 'cessao', label: 'Cessão', icon: <Gift className="w-4 h-4" /> },
    { key: 'historico', label: 'Histórico', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-gold" />
          Trocas e Cessões
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Gerencie trocas de jogadores entre equipes e cessões de atletas
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
            : 'bg-red-900/50 text-red-300 border border-red-700/50'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-gold/20 text-gold border border-gold/50'
                : 'bg-surface-light text-gray-300 hover:text-white hover:bg-surface'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Troca */}
      {activeTab === 'troca' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-gold" />
            Troca de Jogadores
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Selecione dois times e os jogadores que serão trocados entre eles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team A */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Time A</label>
              <select
                value={teamA}
                onChange={(e) => { setTeamA(e.target.value); setPlayerA(''); }}
                className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
              >
                <option value="">-- Selecionar time --</option>
                {teams.filter(t => t.id !== teamB).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              {teamA && (
                <>
                  <label className="block text-sm font-semibold text-gray-300">Jogador do Time A</label>
                  <select
                    value={playerA}
                    onChange={(e) => setPlayerA(e.target.value)}
                    className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
                  >
                    <option value="">-- Selecionar jogador --</option>
                    {teamAPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nickname || p.full_name} ({p.position})
                      </option>
                    ))}
                  </select>
                </>
              )}

              {playerA && (
                <div className="p-3 rounded-lg bg-surface-light border border-gray-700">
                  <p className="text-white font-bold">{getPlayerById(playerA)?.nickname || getPlayerById(playerA)?.full_name}</p>
                  <p className="text-gray-400 text-xs">{getPlayerById(playerA)?.position} — {getTeamById(teamA)?.name}</p>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 top-1/2">
            </div>

            {/* Team B */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Time B</label>
              <select
                value={teamB}
                onChange={(e) => { setTeamB(e.target.value); setPlayerB(''); }}
                className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
              >
                <option value="">-- Selecionar time --</option>
                {teams.filter(t => t.id !== teamA).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              {teamB && (
                <>
                  <label className="block text-sm font-semibold text-gray-300">Jogador do Time B</label>
                  <select
                    value={playerB}
                    onChange={(e) => setPlayerB(e.target.value)}
                    className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
                  >
                    <option value="">-- Selecionar jogador --</option>
                    {teamBPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nickname || p.full_name} ({p.position})
                      </option>
                    ))}
                  </select>
                </>
              )}

              {playerB && (
                <div className="p-3 rounded-lg bg-surface-light border border-gray-700">
                  <p className="text-white font-bold">{getPlayerById(playerB)?.nickname || getPlayerById(playerB)?.full_name}</p>
                  <p className="text-gray-400 text-xs">{getPlayerById(playerB)?.position} — {getTeamById(teamB)?.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Trade Summary */}
          {playerA && playerB && (
            <div className="mt-6 p-4 rounded-lg bg-gold/5 border border-gold/30">
              <h4 className="text-sm font-bold text-gold mb-3">Resumo da Troca</h4>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {getTeamById(teamA) && <TeamLogo team={getTeamById(teamA)!} size={20} />}
                  <span className="text-white font-medium">{getPlayerById(playerA)?.nickname || getPlayerById(playerA)?.full_name}</span>
                </div>
                <ArrowLeftRight className="w-5 h-5 text-gold" />
                <div className="flex items-center gap-2">
                  {getTeamById(teamB) && <TeamLogo team={getTeamById(teamB)!} size={20} />}
                  <span className="text-white font-medium">{getPlayerById(playerB)?.nickname || getPlayerById(playerB)?.full_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-300 mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={tradeNotes}
              onChange={(e) => setTradeNotes(e.target.value)}
              placeholder="Ex: Troca acordada entre representantes"
              className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none text-sm"
            />
          </div>

          {/* Execute */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={executeTrade}
              disabled={!playerA || !playerB || saving}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                playerA && playerB && !saving
                  ? 'bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/20'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowLeftRight className="w-5 h-5" />
              {saving ? 'Processando...' : 'Confirmar Troca'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Cessão */}
      {activeTab === 'cessao' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Gift className="w-5 h-5 text-gold" />
            Cessão de Jogador
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Transfira um jogador de um time para outro sem contrapartida
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* From */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Time de Origem</label>
              <select
                value={cederTeam}
                onChange={(e) => { setCederTeam(e.target.value); setCederPlayer(''); }}
                className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
              >
                <option value="">-- Selecionar time --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              {cederTeam && (
                <>
                  <label className="block text-sm font-semibold text-gray-300">Jogador</label>
                  <select
                    value={cederPlayer}
                    onChange={(e) => setCederPlayer(e.target.value)}
                    className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
                  >
                    <option value="">-- Selecionar jogador --</option>
                    {cederTeamPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nickname || p.full_name} ({p.position})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center pt-10">
              <ChevronRight className="w-8 h-8 text-gold" />
            </div>

            {/* To */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-300">Time de Destino</label>
              <select
                value={receberTeam}
                onChange={(e) => setReceberTeam(e.target.value)}
                className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none"
              >
                <option value="">-- Selecionar time --</option>
                {teams.filter(t => t.id !== cederTeam).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cessão Summary */}
          {cederPlayer && receberTeam && (
            <div className="mt-6 p-4 rounded-lg bg-gold/5 border border-gold/30">
              <h4 className="text-sm font-bold text-gold mb-3">Resumo da Cessão</h4>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {getTeamById(cederTeam) && <TeamLogo team={getTeamById(cederTeam)!} size={20} />}
                  <span className="text-gray-400">{getTeamById(cederTeam)?.name}</span>
                </div>
                <span className="text-white font-medium">
                  {getPlayerById(cederPlayer)?.nickname || getPlayerById(cederPlayer)?.full_name}
                </span>
                <ChevronRight className="w-5 h-5 text-gold" />
                <div className="flex items-center gap-2">
                  {getTeamById(receberTeam) && <TeamLogo team={getTeamById(receberTeam)!} size={20} />}
                  <span className="text-gray-400">{getTeamById(receberTeam)?.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-300 mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={cessaoNotes}
              onChange={(e) => setCessaoNotes(e.target.value)}
              placeholder="Ex: Jogador cedido a pedido do representante"
              className="w-full bg-surface text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-gold focus:outline-none text-sm"
            />
          </div>

          {/* Execute */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={executeCessao}
              disabled={!cederPlayer || !receberTeam || saving}
              className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                cederPlayer && receberTeam && !saving
                  ? 'bg-gold text-black hover:bg-gold/90 shadow-lg shadow-gold/20'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Gift className="w-5 h-5" />
              {saving ? 'Processando...' : 'Confirmar Cessão'}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Histórico */}
      {activeTab === 'historico' && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-gold" />
            Histórico de Trocas e Cessões
          </h3>

          {trades.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-8">
              Nenhuma troca ou cessão realizada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {trades.map(trade => {
                const isTraoca = trade.trade_type === 'TROCA';
                return (
                  <div
                    key={trade.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/50 bg-surface-dark hover:bg-surface-light/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${isTraoca ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                      {isTraoca ? <ArrowLeftRight className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isTraoca ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'
                        }`}>
                          {isTraoca ? 'TROCA' : 'CESSÃO'}
                        </span>
                        <span className="text-white font-medium text-sm">
                          {trade.player?.nickname || trade.player?.full_name}
                        </span>
                        <span className="text-gray-500 text-xs">({trade.player?.position})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          {trade.from_team && <TeamLogo team={trade.from_team} size={14} />}
                          {trade.from_team?.name || 'Sem time'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-600" />
                        <span className="flex items-center gap-1">
                          {trade.to_team && <TeamLogo team={trade.to_team} size={14} />}
                          {trade.to_team?.name}
                        </span>
                      </div>
                      {trade.notes && (
                        <p className="text-gray-500 text-xs mt-1 italic">{trade.notes}</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-gray-500 text-xs">
                        {new Date(trade.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {new Date(trade.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteTrade(trade)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20"
                      title="Desfazer operação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Current Rosters */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Elencos Atuais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const roster = getTeamPlayers(team.id);
            return (
              <div key={team.id} className="p-3 rounded-lg border border-gray-700 bg-surface-dark">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700/50">
                  <TeamLogo team={team} size={20} />
                  <h4 className="font-bold text-white text-sm">{team.name}</h4>
                  <span className="text-xs text-gray-500 ml-auto">{roster.length} jogadores</span>
                </div>
                <div className="space-y-0.5">
                  {roster.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-gray-300">{p.nickname || p.full_name}</span>
                      <span className="text-gray-500">{p.position}</span>
                    </div>
                  ))}
                  {roster.length === 0 && (
                    <p className="text-gray-600 text-xs italic">Sem jogadores</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
