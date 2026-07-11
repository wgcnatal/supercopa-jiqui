'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Team, Player, Position } from '@/lib/types';
import {
  POSITION_LABELS,
  POSITION_LIMITS,
  DRAFT_STORAGE_KEY,
  DraftState,
  DraftPick,
  INITIAL_DRAFT_STATE,
  POT_NAMES,
} from '@/lib/draft-config';
import { Trophy, ChevronRight, Users, Clock } from 'lucide-react';
import Image from 'next/image';

function TeamLogo({ team, size = 20 }: { team: { name: string; color: string; logo_url: string | null }; size?: number }) {
  return team.logo_url ? (
    <Image src={team.logo_url} alt={team.name} width={size} height={size} className="object-contain flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex-shrink-0" style={{ backgroundColor: team.color, width: size, height: size }} />
  );
}

export default function DraftPublicView() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [draftState, setDraftState] = useState<DraftState>(INITIAL_DRAFT_STATE);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const getTeamById = useCallback((id: string) => teams.find(t => t.id === id), [teams]);

  // Load data and poll for updates
  useEffect(() => {
    async function load() {
      const [{ data: teamsData }, { data: playersData }] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('players').select('*').order('nickname'),
      ]);
      setTeams(teamsData || []);
      setAllPlayers(playersData || []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll localStorage for draft state updates (works when admin is on same browser)
  // Also subscribe to Supabase realtime for remote updates
  useEffect(() => {
    function loadState() {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as DraftState;
          setDraftState(parsed);
          setLastUpdate(new Date());
        } catch {
          // ignore
        }
      }
    }

    loadState();
    const interval = setInterval(loadState, 2000);

    // Also listen for storage events from other tabs
    function handleStorage(e: StorageEvent) {
      if (e.key === DRAFT_STORAGE_KEY && e.newValue) {
        try {
          setDraftState(JSON.parse(e.newValue));
          setLastUpdate(new Date());
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Subscribe to realtime player changes
  useEffect(() => {
    const channel = supabase
      .channel('public-draft-players')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'players' },
        (payload) => {
          setAllPlayers(prev =>
            prev.map(p => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          );
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active teams from config
  const activeTeamIds = draftState.config?.activeTeamIds || [];
  const activeTeams = activeTeamIds.length > 0 ? teams.filter(t => activeTeamIds.includes(t.id)) : teams;
  const numTeams = activeTeams.length;

  // Build pre-assigned picks from config representatives
  const preAssignedPicks: DraftPick[] = [];
  if (draftState.phase !== 0 && draftState.config?.representatives) {
    Object.entries(draftState.config.representatives).forEach(([teamId, playerId]) => {
      const player = allPlayers.find(p => p.id === playerId);
      if (player) {
        preAssignedPicks.push({
          round: 0,
          teamId,
          playerId,
          playerNickname: player.nickname || player.full_name,
          source: player.pot || 'REPRESENTANTE',
          timestamp: 0,
        });
      }
    });
  }

  // Build dynamic pots
  const dynamicPots = POT_NAMES.map(potName => ({
    name: potName,
    players: allPlayers.filter(p => p.pot === potName),
  }));
  const potPlayerIds = new Set(allPlayers.filter(p => p.pot).map(p => p.id));

  const allPicks = [...preAssignedPicks, ...draftState.pickHistory];
  const pickedPlayerIds = new Set(allPicks.map(p => p.playerId));

  const teamRosters: Record<string, DraftPick[]> = {};
  activeTeams.forEach(t => { teamRosters[t.id] = []; });
  allPicks.forEach(pick => {
    if (!teamRosters[pick.teamId]) teamRosters[pick.teamId] = [];
    teamRosters[pick.teamId].push(pick);
  });

  const currentOrder = draftState.roundOrders[draftState.currentRound - 1] || [];
  const currentTeamId = currentOrder[draftState.currentTeamIndex];
  const currentTeam = currentTeamId ? getTeamById(currentTeamId) : null;

  // Position counts per team (only representantes + lista geral, NOT potes - potes são coringas)
  const teamPositionCounts: Record<string, Record<string, number>> = {};
  activeTeams.forEach(t => {
    teamPositionCounts[t.id] = { GOL: 0, ZAG: 0, LAT: 0, MEI: 0, ATA: 0 };
  });
  allPicks.forEach(pick => {
    if (pick.source.startsWith('POTE')) return;
    const player = allPlayers.find(p => p.id === pick.playerId);
    if (player && teamPositionCounts[pick.teamId]?.[player.position] !== undefined) {
      teamPositionCounts[pick.teamId][player.position]++;
    }
  });

  // General list players (phase 2)
  const generalListPlayers = allPlayers.filter(
    p => !potPlayerIds.has(p.id) && !pickedPlayerIds.has(p.id) && (p.payment === 'PAGO' || p.payment === 'FREE')
  );
  const playersByPosition: Record<string, Player[]> = {
    GOL: [], ZAG: [], LAT: [], MEI: [], ATA: [],
  };
  generalListPlayers.forEach(p => {
    if (playersByPosition[p.position]) {
      playersByPosition[p.position].push(p);
    }
  });

  // Last few picks for animation
  const recentPicks = draftState.pickHistory.slice(-3).reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const allDone = draftState.isFinished || (
    draftState.phase === 2 && generalListPlayers.length === 0 &&
    allPicks.filter(p => p.source.startsWith('POTE')).length >= dynamicPots.filter(p => p.players.length > 0).length * numTeams
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-gold" />
          <span>Sorteio <span className="gold-gradient">Supercopa Jiqui 2026</span></span>
          <Trophy className="w-8 h-8 text-gold" />
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <p className="text-gray-500 text-sm">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
          {!allDone && draftState.isStarted && (
            <span className="badge-live text-xs ml-2">AO VIVO</span>
          )}
        </div>
      </div>

      {/* Status */}
      {allDone ? (
        <div className="card p-8 text-center border-gold/50 bg-gold/10">
          <Trophy className="w-16 h-16 text-gold mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-gold">Sorteio Concluido!</h2>
          <p className="text-gray-300 mt-2">Todos os jogadores foram distribuidos entre os times.</p>
        </div>
      ) : !draftState.isStarted ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-400">Aguardando Inicio do Sorteio</h2>
          <p className="text-gray-500 mt-2">O sorteio ainda nao comecou. Fique ligado!</p>
        </div>
      ) : (
        <>
          {/* Current Phase & Team */}
          <div className="card p-4 border-gold/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                  {draftState.phase === 1
                    ? 'Fase 1 - Potes Coringa'
                    : 'Fase 2 - Lista Geral'}
                </p>
                <p className="text-xs text-gray-500">Rodada {draftState.currentRound}</p>
              </div>

              {currentTeam && !draftState.needsNewOrder && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gold/10 border border-gold/30">
                  <TeamLogo team={currentTeam} size={24} />
                  <span className="text-gold font-bold text-lg">{currentTeam.name}</span>
                  <span className="text-gray-400 text-sm">esta escolhendo...</span>
                </div>
              )}

              {draftState.needsNewOrder && (
                <div className="px-4 py-2 rounded-lg bg-surface-light">
                  <span className="text-gray-400 text-sm">Aguardando sorteio da ordem...</span>
                </div>
              )}
            </div>

            {/* Order display */}
            {currentOrder.length > 0 && !draftState.needsNewOrder && (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentOrder.map((teamId, idx) => {
                  const team = getTeamById(teamId);
                  const isActive = idx === draftState.currentTeamIndex;
                  const isDone = idx < draftState.currentTeamIndex;
                  return (
                    <div
                      key={teamId}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gold/20 text-gold border border-gold/50 scale-105'
                          : isDone
                            ? 'bg-primary/15 text-primary-light opacity-60'
                            : 'bg-surface-light text-gray-500'
                      }`}
                    >
                      {team && <TeamLogo team={team} size={18} />}
                      {team?.name}
                      {isActive && <ChevronRight className="w-3 h-3 animate-bounce" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Picks */}
          {recentPicks.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Ultimas Escolhas
              </h3>
              <div className="space-y-2">
                {recentPicks.map((pick, i) => {
                  const team = getTeamById(pick.teamId);
                  return (
                    <div
                      key={pick.timestamp}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        i === 0
                          ? 'bg-gold/10 border border-gold/30 animate-pulse'
                          : 'bg-surface-light border border-gray-700/30'
                      }`}
                    >
                      {team && <TeamLogo team={team} size={24} />}
                      <span className="text-gray-300 font-medium">{team?.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                      <span className="text-white font-bold text-lg">{pick.playerNickname}</span>
                      <span className="text-gray-500 text-xs ml-auto">{pick.source}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Players - Pots */}
          {draftState.phase === 1 && (
            <div className="space-y-4">
              {dynamicPots.filter(pot => pot.players.length > 0).map(pot => {
                const available = pot.players.filter(p => !pickedPlayerIds.has(p.id));
                if (available.length === 0 && pot.players.every(p => pickedPlayerIds.has(p.id))) return null;
                return (
                  <div key={pot.name} className="card p-4">
                    <h3 className="text-lg font-bold text-white mb-3">
                      {pot.name} ({available.length} disponiveis)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                      {pot.players.map(player => {
                        const picked = pickedPlayerIds.has(player.id);
                        const pickInfo = allPicks.find(h => h.playerId === player.id);
                        const pickTeam = pickInfo ? getTeamById(pickInfo.teamId) : null;
                        return (
                          <div
                            key={player.id}
                            className={`p-3 rounded-lg border text-center transition-all ${
                              picked
                                ? 'border-gray-700 bg-surface-dark opacity-50'
                                : 'border-gray-600 bg-surface-light'
                            }`}
                          >
                            <p className={`font-bold text-sm ${picked ? 'line-through text-gray-500' : 'text-white'}`}>
                              {player.nickname || player.full_name}
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">{player.full_name}</p>
                            {pickTeam && (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <TeamLogo team={pickTeam} size={14} />
                                <span className="text-xs text-gray-300">{pickTeam.short_name || pickTeam.name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {draftState.phase === 2 && (
            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-3">Lista Geral - Disponiveis</h3>
              <div className="space-y-3">
                {(Object.keys(playersByPosition) as Position[]).map(pos => {
                  const players = playersByPosition[pos];
                  if (players.length === 0) return null;
                  return (
                    <div key={pos}>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">
                        {POSITION_LABELS[pos]} ({players.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {players.map(p => (
                          <span key={p.id} className="px-2 py-1 bg-surface-light rounded text-xs text-gray-300 border border-gray-700/50">
                            <strong>{p.nickname}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Team Rosters */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          Elencos dos Times
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTeams.map(team => {
            const roster = teamRosters[team.id] || [];
            const isActive = team.id === currentTeamId && !draftState.needsNewOrder;
            return (
              <div
                key={team.id}
                className={`card p-4 transition-all duration-500 ${
                  isActive ? 'border-gold/50 shadow-lg shadow-gold/10 scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
                  <TeamLogo team={team} size={24} />
                  <h3 className="font-bold text-white">{team.name}</h3>
                  <span className="text-xs text-gray-500 ml-auto">{roster.length} jogadores</span>
                </div>
                {draftState.phase === 2 && teamPositionCounts[team.id] && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(Object.keys(POSITION_LIMITS) as Position[]).map(pos => (
                      <span
                        key={pos}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          (teamPositionCounts[team.id][pos] || 0) >= POSITION_LIMITS[pos]
                            ? 'bg-primary/20 text-primary-light'
                            : 'bg-surface-light text-gray-500'
                        }`}
                      >
                        {pos}: {teamPositionCounts[team.id][pos] || 0}/{POSITION_LIMITS[pos]}
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  {roster.map((pick, i) => (
                    <div key={pick.playerId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        <span className="text-gray-500 text-xs mr-1">{i + 1}.</span>
                        <strong className="text-white">{pick.playerNickname}</strong>
                      </span>
                      <span className="text-gray-600 text-xs">{pick.source}</span>
                    </div>
                  ))}
                  {roster.length === 0 && (
                    <p className="text-gray-600 text-sm italic text-center py-2">-</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Pick History */}
      {draftState.pickHistory.length > 0 && (
        <div className="card p-4">
          <h3 className="text-lg font-bold text-white mb-3">Historico Completo</h3>
          <div className="max-h-80 overflow-y-auto scrollbar-thin space-y-1">
            {[...draftState.pickHistory].reverse().map((pick, i) => {
              const team = getTeamById(pick.teamId);
              return (
                <div key={i} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-700/20">
                  <span className="text-gray-600 text-xs w-6 text-right">#{draftState.pickHistory.length - i}</span>
                  {team && <TeamLogo team={team} size={18} />}
                  <span className="text-gray-400 text-xs">{team?.name}</span>
                  <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                  <span className="text-white font-semibold">{pick.playerNickname}</span>
                  <span className="text-gray-600 text-xs ml-auto">{pick.source}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
