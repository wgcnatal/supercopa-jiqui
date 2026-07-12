import { Match, Team } from '@/lib/types';
import { Calendar, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
}

function StatusBadge({ status }: { status: string }) {
  const classes = {
    AGENDADO: 'badge-scheduled',
    EM_ANDAMENTO: 'badge-live',
    ENCERRADO: 'badge-finished',
  }[status] || 'badge-scheduled';

  const labels: Record<string, string> = {
    AGENDADO: 'Agendado',
    EM_ANDAMENTO: 'Ao Vivo',
    ENCERRADO: 'Encerrado',
  };

  return <span className={classes}>{labels[status] || status}</span>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Data a definir';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchCard({ match, homeTeam, awayTeam }: MatchCardProps) {
  const home = match.home_team || homeTeam;
  const away = match.away_team || awayTeam;

  return (
    <div className="card-hover p-4">
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={match.status} />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(match.played_at)}</span>
          {match.played_at && (
            <>
              <Clock className="w-3 h-3 ml-1" />
              <span>{formatTime(match.played_at)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: home?.color || '#666' }}
          />
          <span className="font-medium text-white text-sm truncate">
            {home?.short_name || home?.name || 'TBD'}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2 px-4">
          <span
            className={`text-xl font-bold ${
              match.status === 'ENCERRADO' || match.status === 'EM_ANDAMENTO'
                ? 'text-white'
                : 'text-gray-600'
            }`}
          >
            {match.status !== 'AGENDADO' ? match.home_score : '-'}
          </span>
          <span className="text-gray-600 text-sm">x</span>
          <span
            className={`text-xl font-bold ${
              match.status === 'ENCERRADO' || match.status === 'EM_ANDAMENTO'
                ? 'text-white'
                : 'text-gray-600'
            }`}
          >
            {match.status !== 'AGENDADO' ? match.away_score : '-'}
          </span>
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-medium text-white text-sm truncate text-right">
            {away?.short_name || away?.name || 'TBD'}
          </span>
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: away?.color || '#666' }}
          />
        </div>
      </div>

      {match.stage !== 'GRUPO' && (
        <div className="mt-2 text-center">
          <span className="text-xs text-gold font-medium">
            {match.stage === 'SEMI' ? 'Semifinal' : match.stage === 'TERCEIRO' ? '3º Lugar' : 'Final'}
          </span>
        </div>
      )}
    </div>
  );
}
