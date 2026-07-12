export type Position = 'GOL' | 'ZAG' | 'LAT' | 'VOL' | 'MEI' | 'ATA'; // VOL mantido para compatibilidade mas migrado para MEI
export type PaymentStatus = 'PAGO' | 'PENDENTE' | 'FREE';
export type CardType = 'YELLOW' | 'RED';
export type MatchStage = 'GRUPO' | 'SEMI' | 'FINAL' | 'TERCEIRO';
export type MatchStatus = 'AGENDADO' | 'EM_ANDAMENTO' | 'ENCERRADO';

export interface Player {
  id: string;
  full_name: string;
  nickname: string;
  position: Position;
  is_member: boolean;
  payment: PaymentStatus;
  team_id: string | null;
  shirt_number: number | null;
  photo_url: string | null;
  pot: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string | null;
  color: string;
  logo_url: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  played_at: string | null;
  round: number | null;
  stage: MatchStage;
  status: MatchStatus;
  created_at: string;
  // Joined data
  home_team?: Team;
  away_team?: Team;
}

export interface Goal {
  id: string;
  match_id: string;
  player_id: string;
  minute: number;
  is_own_goal: boolean;
  created_at: string;
  // Joined data
  player?: Player;
}

export interface Card {
  id: string;
  match_id: string;
  player_id: string;
  card_type: CardType;
  minute: number;
  created_at: string;
  // Joined data
  player?: Player;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  created_at: string;
}

export type TradeType = 'TROCA' | 'CESSAO';

export interface Trade {
  id: string;
  player_id: string;
  from_team_id: string | null;
  to_team_id: string;
  trade_type: TradeType;
  linked_trade_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined data
  player?: Player;
  from_team?: Team;
  to_team?: Team;
}

export interface StandingRow {
  team: Team;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface TopScorer {
  player: Player;
  goals: number;
  team?: Team;
}

export interface CardStat {
  player: Player;
  yellowCards: number;
  redCards: number;
  team?: Team;
}
