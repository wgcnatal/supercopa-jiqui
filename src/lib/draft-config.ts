// Position limits and labels use string keys for flexibility

export interface PotPlayer {
  id: string;
  nickname: string;
  full_name: string;
}

export interface Pot {
  name: string;
  players: PotPlayer[];
}

// Position limits per team
export const POSITION_LIMITS: Record<string, number> = {
  GOL: 1,
  ZAG: 1,
  LAT: 2,
  MEI: 2,
  ATA: 2,
};

export const POSITION_LABELS: Record<string, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meia',
  ATA: 'Atacante',
};

export interface DraftPick {
  round: number;
  teamId: string;
  playerId: string;
  playerNickname: string;
  source: string; // pot name or position
  timestamp: number;
}

export interface DraftConfig {
  activeTeamIds: string[]; // which teams participate
  representatives: Record<string, string>; // teamId -> playerId
}

export interface DraftState {
  phase: 0 | 1 | 2; // 0 = config, 1 = pots, 2 = general list
  currentRound: number;
  currentTeamIndex: number;
  pickHistory: DraftPick[];
  roundOrders: string[][]; // team IDs in order for each round
  positionHistory: Record<string, number[]>;
  isStarted: boolean;
  isFinished: boolean;
  needsNewOrder: boolean;
  config: DraftConfig;
}

export const INITIAL_DRAFT_STATE: DraftState = {
  phase: 0, // starts in config
  currentRound: 1,
  currentTeamIndex: 0,
  pickHistory: [],
  roundOrders: [],
  positionHistory: {},
  isStarted: false,
  isFinished: false,
  needsNewOrder: true,
  config: {
    activeTeamIds: [],
    representatives: {},
  },
};

export const DRAFT_STORAGE_KEY = 'supercopa-jiqui-draft-2026';

export const POT_NAMES = ['POTE 1', 'POTE 2', 'POTE 3', 'POTE 4', 'POTE 5'];
