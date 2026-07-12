import { createClient } from '@/lib/supabase/server';
import { Team, Player } from '@/lib/types';
import { POT_NAMES } from '@/lib/draft-config';
import { Trophy, Users } from 'lucide-react';
import Image from 'next/image';

export const revalidate = 60;

export const metadata = {
  title: 'Sorteio - Supercopa Jiqui 2026',
  description: 'Resultado do sorteio de jogadores da Supercopa Jiqui 2026',
};

function TeamLogo({ team, size = 20 }: { team: Team; size?: number }) {
  return team.logo_url ? (
    <Image src={team.logo_url} alt={team.name} width={size} height={size} className="object-contain flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex-shrink-0" style={{ backgroundColor: team.color, width: size, height: size }} />
  );
}

export default async function SorteioPage() {
  const supabase = createClient();

  const [{ data: teams }, { data: players }] = await Promise.all([
    supabase.from('teams').select('*').order('name'),
    supabase.from('players').select('*').order('nickname'),
  ]);

  const allTeams = (teams || []) as Team[];
  const allPlayers = (players || []) as Player[];

  // Build rosters per team
  const teamRosters: Record<string, Player[]> = {};
  allTeams.forEach(t => { teamRosters[t.id] = []; });
  allPlayers.forEach(p => {
    if (p.team_id && teamRosters[p.team_id]) {
      teamRosters[p.team_id].push(p);
    }
  });

  // Pots info
  const potPlayers = POT_NAMES.map(potName => ({
    name: potName,
    players: allPlayers.filter(p => p.pot === potName),
  })).filter(pot => pot.players.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-gold" />
          <span>Sorteio <span className="gold-gradient">Supercopa Jiqui 2026</span></span>
          <Trophy className="w-8 h-8 text-gold" />
        </h1>
      </div>

      {/* Status */}
      <div className="card p-8 text-center border-gold/50 bg-gold/10">
        <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gold">Sorteio Concluído!</h2>
        <p className="text-gray-300 mt-2">
          Todos os jogadores foram distribuídos entre os {allTeams.length} times.
        </p>
      </div>

      {/* Elencos dos Times */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          Elencos dos Times
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTeams.map(team => {
            const roster = teamRosters[team.id] || [];
            // Separate pot players and regular players
            return (
              <div key={team.id} className="card p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
                  <TeamLogo team={team} size={28} />
                  <h3 className="font-bold text-white">{team.name}</h3>
                  <span className="text-xs text-gray-500 ml-auto">{roster.length} jogadores</span>
                </div>
                <div className="space-y-1">
                  {roster
                    .sort((a, b) => {
                      const posOrder = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
                      return posOrder.indexOf(a.position) - posOrder.indexOf(b.position);
                    })
                    .map((player, i) => (
                    <div key={player.id} className="flex items-center justify-between text-sm py-0.5">
                      <span className="text-gray-300">
                        <span className="text-gray-500 text-xs mr-1">{i + 1}.</span>
                        <strong className="text-white">{player.nickname || player.full_name}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        {player.pot && (
                          <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded">
                            {player.pot}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {player.position}
                        </span>
                      </div>
                    </div>
                  ))}
                  {roster.length === 0 && (
                    <p className="text-gray-600 text-sm italic text-center py-2">Sem jogadores</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Potes */}
      {potPlayers.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Potes do Sorteio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {potPlayers.map(pot => (
              <div key={pot.name} className="card p-4">
                <h3 className="text-sm font-bold text-gold mb-3 text-center">{pot.name}</h3>
                <div className="space-y-2">
                  {pot.players.map(player => {
                    const team = allTeams.find(t => t.id === player.team_id);
                    return (
                      <div key={player.id} className="flex items-center justify-between text-xs">
                        <span className="text-white font-medium">{player.nickname || player.full_name}</span>
                        {team && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <TeamLogo team={team} size={14} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Como funcionou o sorteio */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-white mb-4">Como Funcionou o Sorteio</h2>
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h3 className="font-bold text-gold mb-2">Fase 1 — Potes Coringa</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Os jogadores foram divididos em <span className="text-white font-medium">{potPlayers.length} potes</span> com os atletas mais disputados</li>
              <li>Cada equipe escolheu 1 jogador de cada pote, na ordem sorteada</li>
              <li>Jogadores dos potes são <span className="text-white font-medium">coringas</span> — não contam na limitação de posição</li>
              <li>Os representantes de cada equipe já estavam pré-atribuídos aos seus times</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gold mb-2">Fase 2 — Lista Geral</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Jogadores restantes foram escolhidos por posição: Goleiro, Zagueiro, Lateral, Meia e Atacante</li>
              <li>Cada posição tinha um limite por equipe para garantir equilíbrio</li>
              <li>A ordem de escolha foi balanceada — quem escolheu primeiro em uma rodada, escolheu por último na seguinte</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gold mb-2">Ordem do Sorteio</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Rodadas ímpares: ordem sorteada aleatoriamente com balanceamento</li>
              <li>Rodadas pares: ordem invertida automaticamente (espelho da anterior)</li>
              <li>Isso garantiu equidade na ordem de escolha entre todas as equipes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
