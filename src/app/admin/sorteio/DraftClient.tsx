'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Team, Player, Position } from '@/lib/types';
import {
  POSITION_LIMITS,
  POSITION_LABELS,
  NUM_TEAMS,
  DraftState,
  DraftPick,
  INITIAL_DRAFT_STATE,
  DRAFT_STORAGE_KEY,
  PRE_ASSIGNED,
} from '@/lib/draft-config';

const POT_NAMES = ['POTE 1', 'POTE 2', 'POTE 3', 'POTE 4', 'POTE 5'];
import { Shuffle, Undo2, ChevronRight, Trophy, AlertTriangle, RotateCcw, Lock, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

function generateBalancedOrder(teamIds: string[], positionHistory: Record<string, number[]>): string[] {
  const scored = teamIds.map(id => {
    const hist = positionHistory[id] || [];
    const timesFirst = hist.filter(p => p === 0).length;
    const timesSecond = hist.filter(p => p === 1).length;
    return { id, score: timesFirst * 100 + timesSecond * 10 + Math.random() };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored.map(s => s.id);
}

export default function DraftClient() {
  const supabase = createClient();
  const [teams, setTeams] = useState<Team[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [draftState, setDraftState] = useState<DraftState>(INITIAL_DRAFT_STATE);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [animatingPick, setAnimatingPick] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const stateRef = useRef(draftState);

  useEffect(() => { stateRef.current = draftState; }, [draftState]);

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftState));
    }
  }, [draftState, loading]);

  // Load data
  useEffect(() => {
    async function load() {
      const [{ data: teamsData }, { data: playersData }] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('players').select('*').order('full_name'),
      ]);
      setTeams(teamsData || []);
      setAllPlayers(playersData || []);

      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        try {
          setDraftState(JSON.parse(saved) as DraftState);
        } catch { /* ignore */ }
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTeamById = useCallback((id: string) => teams.find(t => t.id === id), [teams]);

  // Build dynamic pots from player.pot field
  const dynamicPots = POT_NAMES.map(potName => ({
    name: potName,
    players: allPlayers.filter(p => p.pot === potName),
  }));
  const potPlayerIds = new Set(allPlayers.filter(p => p.pot).map(p => p.id));

  // Build pre-assigned picks from representatives
  const preAssignedPicks: DraftPick[] = [];
  PRE_ASSIGNED.forEach(pa => {
    const player = allPlayers.find(p => p.id === pa.playerId);
    if (player && player.team_id) {
      preAssignedPicks.push({
        round: 0,
        teamId: player.team_id,
        playerId: pa.playerId,
        playerNickname: pa.nickname,
        source: pa.source,
        timestamp: 0,
      });
    }
  });

  // Derived state - combine pre-assigned + draft picks
  const allPicks = [...preAssignedPicks, ...draftState.pickHistory];
  const pickedPlayerIds = new Set(allPicks.map(p => p.playerId));

  const teamRosters: Record<string, DraftPick[]> = {};
  teams.forEach(t => { teamRosters[t.id] = []; });
  allPicks.forEach(pick => {
    if (!teamRosters[pick.teamId]) teamRosters[pick.teamId] = [];
    teamRosters[pick.teamId].push(pick);
  });

  const currentOrder = draftState.roundOrders[draftState.currentRound - 1] || [];
  const currentTeamId = currentOrder[draftState.currentTeamIndex];
  const currentTeam = currentTeamId ? getTeamById(currentTeamId) : null;

  // Phase 1: which pots has the current team already picked from?
  const currentTeamPotsPicked = new Set(
    allPicks
      .filter(p => p.teamId === currentTeamId && p.source.startsWith('POTE'))
      .map(p => p.source)
  );

  // Phase 1 complete when all teams picked from all pots
  const totalPotPicks = allPicks.filter(p => p.source.startsWith('POTE')).length;
  const activePots = dynamicPots.filter(pot => pot.players.length > 0);
  const phase1Complete = totalPotPicks >= activePots.length * NUM_TEAMS;

  // Phase 2: general list
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

  // Position counts per team (phase 2 picks only)
  const teamPositionCounts: Record<string, Record<string, number>> = {};
  teams.forEach(t => {
    teamPositionCounts[t.id] = { GOL: 0, ZAG: 0, LAT: 0, MEI: 0, ATA: 0 };
  });
  draftState.pickHistory.forEach(pick => {
    if (!pick.source.startsWith('POTE')) {
      const pos = pick.source as Position;
      if (teamPositionCounts[pick.teamId]?.[pos] !== undefined) {
        teamPositionCounts[pick.teamId][pos]++;
      }
    }
  });

  function canPickPosition(pos: Position): boolean {
    if (!currentTeamId) return false;
    const count = teamPositionCounts[currentTeamId]?.[pos] || 0;
    const limit = POSITION_LIMITS[pos];
    if (count >= limit) return false;
    if (count > 0) {
      const allTeamsFilled = teams.every(t => (teamPositionCounts[t.id]?.[pos] || 0) >= count);
      if (!allTeamsFilled) return false;
    }
    return true;
  }

  const allPlayersAssigned = phase1Complete && generalListPlayers.length === 0;

  // Stats: eligible players
  const eligiblePlayers = allPlayers.filter(p => p.payment === 'PAGO' || p.payment === 'FREE');
  // potPlayersCount used below in stats
  const totalEligible = eligiblePlayers.length;
  const totalPicked = allPicks.length;
  const totalRemaining = generalListPlayers.length;
  const potRemaining = dynamicPots.reduce((sum, pot) => sum + pot.players.filter(p => !pickedPlayerIds.has(p.id)).length, 0);

  // Generate round order
  function generateOrder() {
    const teamIds = teams.map(t => t.id);
    const roundNum = draftState.currentRound;
    const isEven = roundNum % 2 === 0;

    let newOrder: string[];
    if (isEven && draftState.roundOrders.length > 0) {
      const prevOrder = draftState.roundOrders[draftState.roundOrders.length - 1];
      newOrder = [...prevOrder].reverse();
    } else {
      newOrder = generateBalancedOrder(teamIds, draftState.positionHistory);
    }

    const newRoundOrders = [...draftState.roundOrders];
    newRoundOrders[roundNum - 1] = newOrder;

    const newPositionHistory = { ...draftState.positionHistory };
    if (roundNum % 2 !== 0) {
      newOrder.forEach((tid, idx) => {
        if (!newPositionHistory[tid]) newPositionHistory[tid] = [];
        newPositionHistory[tid] = [...newPositionHistory[tid], idx];
      });
    }

    setDraftState(prev => ({
      ...prev,
      roundOrders: newRoundOrders,
      positionHistory: newPositionHistory,
      needsNewOrder: false,
      isStarted: true,
    }));
  }

  // Pick a player
  async function pickPlayer(playerId: string, playerNickname: string, source: string) {
    if (!currentTeamId) return;

    setAnimatingPick(playerId);

    await supabase.from('players').update({ team_id: currentTeamId }).eq('id', playerId);

    const pick: DraftPick = {
      round: draftState.currentRound,
      teamId: currentTeamId,
      playerId,
      playerNickname,
      source,
      timestamp: Date.now(),
    };

    setTimeout(() => {
      setDraftState(prev => {
        const newHistory = [...prev.pickHistory, pick];
        let nextTeamIndex = prev.currentTeamIndex + 1;
        let nextRound = prev.currentRound;
        let nextPhase = prev.phase;
        let needsNewOrder = false;

        if (nextTeamIndex >= NUM_TEAMS) {
          // All teams picked in this round
          nextTeamIndex = 0;
          nextRound = prev.currentRound + 1;
          needsNewOrder = true;

          // Check if phase 1 is complete (include pre-assigned)
          const potPicks = [...preAssignedPicks, ...newHistory].filter(p => p.source.startsWith('POTE')).length;
          if (prev.phase === 1 && potPicks >= activePots.length * NUM_TEAMS) {
            nextPhase = 2;
          }
        }

        return {
          ...prev,
          pickHistory: newHistory,
          currentTeamIndex: nextTeamIndex,
          currentRound: nextRound,
          phase: nextPhase,
          needsNewOrder,
        };
      });
      setAnimatingPick(null);
    }, 500);
  }

  // Undo last pick
  async function undoLastPick() {
    const lastPick = draftState.pickHistory[draftState.pickHistory.length - 1];
    if (!lastPick) return;

    await supabase.from('players').update({ team_id: null }).eq('id', lastPick.playerId);

    setDraftState(prev => {
      const newHistory = prev.pickHistory.slice(0, -1);
      const prevTeamIndex = prev.currentTeamIndex - 1;

      if (prevTeamIndex >= 0) {
        return { ...prev, pickHistory: newHistory, currentTeamIndex: prevTeamIndex, needsNewOrder: false };
      } else {
        // Go back to end of previous round
        const prevRound = prev.currentRound - 1;
        if (prevRound >= 1) {
          // Check if we need to go back to phase 1
          const potPicks = [...preAssignedPicks, ...newHistory].filter(p => p.source.startsWith('POTE')).length;
          const wasPhase1 = potPicks < activePots.length * NUM_TEAMS;
          return {
            ...prev,
            pickHistory: newHistory,
            currentTeamIndex: NUM_TEAMS - 1,
            currentRound: prevRound,
            phase: wasPhase1 ? 1 : prev.phase,
            needsNewOrder: false,
          };
        }
        return { ...prev, pickHistory: newHistory, currentTeamIndex: 0, needsNewOrder: false };
      }
    });
  }

  // Reset draft
  async function resetDraft() {
    const pickedIds = draftState.pickHistory.map(p => p.playerId);
    if (pickedIds.length > 0) {
      for (const pid of pickedIds) {
        await supabase.from('players').update({ team_id: null }).eq('id', pid);
      }
    }
    // Keep representatives assigned
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftState(INITIAL_DRAFT_STATE);
    setConfirmReset(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-gold" />
            Controle do Sorteio
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {draftState.phase === 1 ? 'Fase 1 - Potes Coringa' : 'Fase 2 - Lista Geral'}
            {' | '}Rodada {draftState.currentRound}
            {' | '}{draftState.pickHistory.length} escolhas realizadas
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={undoLastPick}
            disabled={draftState.pickHistory.length === 0}
            className="btn-outline text-sm flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            Desfazer
          </button>
          {confirmReset ? (
            <div className="flex gap-2">
              <button onClick={resetDraft} className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Confirmar Reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn-outline text-sm">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="btn-outline text-sm flex items-center gap-1 text-red-400 border-red-400/50 hover:border-red-400">
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* Regras do Sorteio */}
      <div className="card overflow-hidden">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-light/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            <span className="text-sm font-bold text-white">Regras do Sorteio</span>
          </div>
          {showRules ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showRules && (
          <div className="px-4 pb-4 space-y-4 text-sm text-gray-300 border-t border-gray-700/50 pt-4">
            <div>
              <h4 className="font-bold text-gold mb-2">Fase 1 - Potes Coringa</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li>Existem <span className="text-white font-medium">5 potes</span> com <span className="text-white font-medium">7 jogadores</span> cada</li>
                <li>Cada equipe escolhe <span className="text-white font-medium">1 jogador de cada pote</span></li>
                <li>A escolha do pote e livre — nao ha sequencia obrigatoria</li>
                <li>Apos escolher de um pote, o pote fica bloqueado para aquela equipe</li>
                <li>Os representantes ja estao pre-atribuidos aos seus times</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gold mb-2">Fase 2 - Lista Geral</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li>Jogadores restantes separados por posicao: <span className="text-white font-medium">GOL, ZAG, LAT, MEI, ATA</span></li>
                <li>Limite por posicao que cada time deve preencher antes de repetir:</li>
                <li className="ml-4">Goleiro: <span className="text-white font-medium">1</span> | Zagueiro: <span className="text-white font-medium">1</span> | Lateral: <span className="text-white font-medium">2</span> | Meia: <span className="text-white font-medium">2</span> | Atacante: <span className="text-white font-medium">2</span></li>
                <li>Uma equipe so pode escolher um 2o jogador de uma posicao apos <span className="text-white font-medium">todas as equipes</span> preencherem aquela posicao</li>
                <li>Apenas jogadores com status <span className="text-emerald-400 font-medium">PAGO</span> ou <span className="text-cyan-400 font-medium">FREE</span> participam</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gold mb-2">Ordem do Sorteio</h4>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                <li><span className="text-white font-medium">Rodadas impares:</span> ordem sorteada aleatoriamente com balanceamento</li>
                <li><span className="text-white font-medium">Rodadas pares:</span> ordem invertida automaticamente (espelho da anterior)</li>
                <li>Quem ja foi 1o a escolher nao repete ate todos terem sido 1o</li>
                <li>Isso garante <span className="text-white font-medium">equidade</span> na ordem de escolha entre todas as equipes</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Quantitativo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalEligible}</p>
          <p className="text-xs text-gray-400">Aptos (Pago + Free)</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-gold">{totalPicked}</p>
          <p className="text-xs text-gray-400">Ja escolhidos</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-emerald-400">{potRemaining}</p>
          <p className="text-xs text-gray-400">Restam nos potes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{totalRemaining}</p>
          <p className="text-xs text-gray-400">Restam lista geral</p>
        </div>
      </div>

      {/* Status */}
      {allPlayersAssigned ? (
        <div className="card p-6 text-center border-gold/50 bg-gold/10">
          <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gold">Sorteio Concluido!</h3>
          <p className="text-gray-300 mt-1">Todos os jogadores foram distribuidos.</p>
        </div>
      ) : (
        <>
          {/* Current Order & Team */}
          <div className="card p-4">
            {draftState.needsNewOrder || !draftState.isStarted ? (
              <div className="text-center py-4">
                <p className="text-gray-300 mb-4">
                  {!draftState.isStarted
                    ? 'Clique para sortear a ordem da primeira rodada'
                    : draftState.currentRound % 2 === 0
                      ? 'Rodada par - ordem invertida automaticamente'
                      : 'Sortear nova ordem para esta rodada'}
                </p>
                <button
                  onClick={generateOrder}
                  className="btn-gold text-lg px-8 py-3 flex items-center gap-2 mx-auto animate-pulse"
                >
                  <Shuffle className="w-5 h-5" />
                  {draftState.currentRound % 2 === 0 ? 'Inverter Ordem' : 'Sortear Ordem'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Ordem da Rodada {draftState.currentRound}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentOrder.map((teamId, idx) => {
                    const team = getTeamById(teamId);
                    const isActive = idx === draftState.currentTeamIndex;
                    const isDone = idx < draftState.currentTeamIndex;
                    return (
                      <div
                        key={teamId}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'bg-gold/20 text-gold border-2 border-gold scale-105 shadow-lg shadow-gold/20'
                            : isDone
                              ? 'bg-primary/20 text-primary-light opacity-60'
                              : 'bg-surface-light text-gray-400'
                        }`}
                      >
                        {team?.logo_url ? (
                          <Image src={team.logo_url} alt={team.name} width={24} height={24} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: team?.color || '#666' }}>{idx + 1}</span>
                        )}
                        {team?.name || teamId}
                        {isActive && <ChevronRight className="w-4 h-4 animate-bounce" />}
                      </div>
                    );
                  })}
                </div>
                {currentTeam && (
                  <div className="mt-4 p-3 rounded-lg bg-gold/10 border border-gold/30">
                    <p className="text-gold font-bold text-lg">
                      Vez de: {currentTeam.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {draftState.phase === 1
                        ? 'Escolha um jogador de qualquer pote disponivel'
                        : 'Escolha um jogador da lista geral'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phase 1: ALL POTS - free choice */}
          {draftState.phase === 1 && !draftState.needsNewOrder && draftState.isStarted && (
            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Potes Coringa - Escolha Livre</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dynamicPots.filter(pot => pot.players.length > 0).map((pot) => {
                  const alreadyPickedFromPot = currentTeamPotsPicked.has(pot.name);
                  const availablePlayers = pot.players.filter(p => !pickedPlayerIds.has(p.id));
                  const allPicked = availablePlayers.length === 0;

                  return (
                    <div
                      key={pot.name}
                      className={`p-4 rounded-lg border ${
                        alreadyPickedFromPot || allPicked
                          ? 'border-gray-700 bg-surface-dark opacity-50'
                          : 'border-gold/30 bg-gold/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-bold text-sm ${alreadyPickedFromPot || allPicked ? 'text-gray-500' : 'text-gold'}`}>
                          {pot.name}
                        </h4>
                        {alreadyPickedFromPot && (
                          <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Ja escolheu
                          </span>
                        )}
                        {allPicked && !alreadyPickedFromPot && (
                          <span className="text-xs text-gray-500">Esgotado</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {pot.players.map(player => {
                          const isPicked = pickedPlayerIds.has(player.id);
                          const pickInfo = allPicks.find(h => h.playerId === player.id);
                          const pickTeam = pickInfo ? getTeamById(pickInfo.teamId) : null;
                          const canPick = !isPicked && !alreadyPickedFromPot && !allPicked && !!currentTeamId;

                          return (
                            <div key={player.id} className="flex items-center gap-2">
                              {isPicked ? (
                                <div className="flex items-center justify-between w-full text-xs py-1.5 px-2 rounded bg-surface-dark">
                                  <span className="line-through text-gray-500">{player.nickname || player.full_name}</span>
                                  {pickTeam && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-gray-300">
                                      {pickTeam.logo_url ? (
                                        <Image src={pickTeam.logo_url} alt={pickTeam.name} width={16} height={16} className="w-4 h-4 object-contain" />
                                      ) : (
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pickTeam.color }} />
                                      )}
                                      {pickTeam.short_name || pickTeam.name}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => pickPlayer(player.id, player.nickname || player.full_name, pot.name)}
                                  disabled={!canPick || !!animatingPick}
                                  className={`w-full text-left p-2 rounded-lg border transition-all duration-200 ${
                                    animatingPick === player.id
                                      ? 'border-gold bg-gold/30 scale-105 shadow-lg shadow-gold/30'
                                      : canPick
                                        ? 'border-gray-600 bg-surface-light hover:border-gold/70 hover:bg-surface hover:scale-[1.02]'
                                        : 'border-gray-700 bg-surface-dark cursor-not-allowed opacity-40'
                                  }`}
                                >
                                  <p className="font-bold text-white text-sm">{player.nickname}</p>
                                  <p className="text-gray-500 text-xs">{player.full_name}</p>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* General List (visible in both phases) */}
          {!draftState.needsNewOrder && draftState.isStarted && generalListPlayers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Lista Geral por Posicao
                <span className="text-sm font-normal text-gray-400">({generalListPlayers.length} disponiveis)</span>
              </h3>
              {(Object.keys(playersByPosition) as Position[]).map(pos => {
                const players = playersByPosition[pos];
                if (players.length === 0) return null;
                const posAvailable = draftState.phase === 2 ? canPickPosition(pos) : true;
                return (
                  <div key={pos} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {POSITION_LABELS[pos]} ({pos}) - {players.length} disponiveis
                      </h3>
                      {draftState.phase === 2 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            Limite: {POSITION_LIMITS[pos]} por time
                          </span>
                          {!posAvailable && currentTeamId && (
                            <span className="flex items-center gap-1 text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" />
                              Bloqueado
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {players.map(player => (
                        <button
                          key={player.id}
                          onClick={() => pickPlayer(player.id, player.nickname || player.full_name, pos)}
                          disabled={!currentTeamId || !posAvailable || !!animatingPick}
                          className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                            animatingPick === player.id
                              ? 'border-gold bg-gold/30 scale-105 shadow-lg shadow-gold/30'
                              : posAvailable
                                ? 'border-gray-600 bg-surface-light hover:border-gold/70 hover:bg-surface hover:scale-105'
                                : 'border-gray-700 bg-surface-dark opacity-40 cursor-not-allowed'
                          } disabled:cursor-not-allowed`}
                        >
                          <p className="font-bold text-white text-sm">{player.nickname || player.full_name}</p>
                          <p className="text-gray-500 text-xs">{player.full_name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Team Rosters */}
      <div className="card p-4">
        <h3 className="text-lg font-bold text-white mb-4">Elencos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => {
            const roster = teamRosters[team.id] || [];
            const isActive = team.id === currentTeamId;
            const posCounts = teamPositionCounts[team.id] || {};

            // Count pots picked by this team
            const potsPicked = new Set(
              draftState.pickHistory
                .filter(p => p.teamId === team.id && p.source.startsWith('POTE'))
                .map(p => p.source)
            );

            return (
              <div
                key={team.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? 'border-gold/60 bg-gold/5 shadow-lg shadow-gold/10'
                    : 'border-gray-700 bg-surface-dark'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {team.logo_url ? (
                    <Image src={team.logo_url} alt={team.name} width={24} height={24} className="w-6 h-6 object-contain" />
                  ) : (
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                  )}
                  <h4 className="font-bold text-white text-sm">{team.name}</h4>
                  <span className="text-xs text-gray-500 ml-auto">{roster.length} jogadores</span>
                </div>

                {draftState.phase === 1 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dynamicPots.filter(pot => pot.players.length > 0).map(pot => (
                      <span
                        key={pot.name}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          potsPicked.has(pot.name)
                            ? 'bg-primary/20 text-primary-light'
                            : 'bg-surface-light text-gray-500'
                        }`}
                      >
                        {pot.name.replace('POTE ', 'P')}{potsPicked.has(pot.name) ? ' ✓' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {draftState.phase === 2 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(Object.keys(POSITION_LIMITS) as Position[]).map(pos => (
                      <span
                        key={pos}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          (posCounts[pos] || 0) >= POSITION_LIMITS[pos]
                            ? 'bg-primary/20 text-primary-light'
                            : 'bg-surface-light text-gray-400'
                        }`}
                      >
                        {pos}: {posCounts[pos] || 0}/{POSITION_LIMITS[pos]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {roster.map((pick, i) => (
                    <div key={pick.playerId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">
                        {i + 1}. <strong>{pick.playerNickname}</strong>
                      </span>
                      <span className="text-gray-500">{pick.source}</span>
                    </div>
                  ))}
                  {roster.length === 0 && (
                    <p className="text-gray-600 text-xs italic">Nenhum jogador ainda</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pick History */}
      <div className="card p-4">
        <h3 className="text-lg font-bold text-white mb-4">Historico de Escolhas</h3>
        {draftState.pickHistory.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Nenhuma escolha realizada ainda.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1">
            {[...draftState.pickHistory].reverse().map((pick, i) => {
              const team = getTeamById(pick.teamId);
              return (
                <div key={i} className="flex items-center gap-2 text-sm py-1 border-b border-gray-700/30">
                  <span className="text-gray-500 text-xs w-8">#{draftState.pickHistory.length - i}</span>
                  {team?.logo_url ? (
                    <Image src={team.logo_url} alt={team.name} width={20} height={20} className="w-5 h-5 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team?.color || '#666' }} />
                  )}
                  <span className="text-gray-300 font-medium">{team?.name}</span>
                  <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                  <span className="text-white font-bold">{pick.playerNickname}</span>
                  <span className="text-gray-500 text-xs ml-auto">{pick.source}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
