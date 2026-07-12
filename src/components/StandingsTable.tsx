'use client';

import { Match, Team, StandingRow } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

function calculateStandings(matches: Match[], teams: Team[]): StandingRow[] {
  const standingsMap = new Map<string, StandingRow>();

  teams.forEach((team) => {
    standingsMap.set(team.id, {
      team,
      points: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });
  });

  const groupMatches = matches.filter(
    (m) => m.stage === 'GRUPO' && m.status === 'ENCERRADO'
  );

  groupMatches.forEach((match) => {
    const home = standingsMap.get(match.home_team_id);
    const away = standingsMap.get(match.away_team_id);

    if (!home || !away) return;

    home.played++;
    away.played++;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.wins++;
      home.points += 3;
      away.losses++;
    } else if (match.home_score < match.away_score) {
      away.wins++;
      away.points += 3;
      home.losses++;
    } else {
      home.draws++;
      away.draws++;
      home.points += 1;
      away.points += 1;
    }
  });

  const standings = Array.from(standingsMap.values());
  standings.forEach((s) => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}

interface StandingsTableProps {
  matches: Match[];
  teams: Team[];
  compact?: boolean;
}

export function StandingsTable({ matches, teams, compact = false }: StandingsTableProps) {
  const standings = calculateStandings(matches, teams);

  if (teams.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-400">Nenhum time cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-light border-b border-gray-700/50">
              <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">#</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
              <th className="text-center py-3 px-2 text-gray-400 font-medium">PTS</th>
              <th className="text-center py-3 px-2 text-gray-400 font-medium">J</th>
              <th className="text-center py-3 px-2 text-gray-400 font-medium">V</th>
              <th className="text-center py-3 px-2 text-gray-400 font-medium">E</th>
              <th className="text-center py-3 px-2 text-gray-400 font-medium">D</th>
              {!compact && (
                <>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">GP</th>
                  <th className="text-center py-3 px-2 text-gray-400 font-medium">GC</th>
                </>
              )}
              <th className="text-center py-3 px-2 text-gray-400 font-medium">SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr
                key={row.team.id}
                className={`border-b border-gray-700/30 hover:bg-surface-light/50 transition-colors ${
                  index < 4 ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                }`}
              >
                <td className="py-3 px-4 text-gray-400 font-mono">{index + 1}</td>
                <td className="py-3 px-4">
                  <Link
                    href={`/times/${row.team.id}`}
                    className="flex items-center gap-2 hover:text-gold transition-colors"
                  >
                    {row.team.logo_url ? (
                      <Image
                        src={row.team.logo_url}
                        alt={row.team.name}
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0"
                        style={{ backgroundColor: row.team.color }}
                      />
                    )}
                    <span className="font-medium text-white">
                      {row.team.name}
                    </span>
                  </Link>
                </td>
                <td className="text-center py-3 px-2 font-bold text-gold">
                  {row.points}
                </td>
                <td className="text-center py-3 px-2 text-gray-300">{row.played}</td>
                <td className="text-center py-3 px-2 text-green-400">{row.wins}</td>
                <td className="text-center py-3 px-2 text-gray-300">{row.draws}</td>
                <td className="text-center py-3 px-2 text-red-400">{row.losses}</td>
                {!compact && (
                  <>
                    <td className="text-center py-3 px-2 text-gray-300">{row.goalsFor}</td>
                    <td className="text-center py-3 px-2 text-gray-300">{row.goalsAgainst}</td>
                  </>
                )}
                <td className="text-center py-3 px-2 text-gray-300">
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact && (
        <div className="px-4 py-2 bg-surface-light/30 text-xs text-gray-500">
          Os 4 primeiros se classificam para as semifinais
        </div>
      )}
    </div>
  );
}
