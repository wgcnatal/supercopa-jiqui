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

export const POTS: Pot[] = [
  {
    name: 'POTE 1',
    players: [
      { id: '02a72c02-d983-4da3-bfd0-eef95846f9bb', nickname: 'ELIAS', full_name: 'Elias Gomes de Paiva' },
      { id: '7ab9fcfc-b270-4294-8f2d-45e1c9f0d6e1', nickname: 'DJAVAN', full_name: 'Djavan Tavares de Melo' },
      { id: '377eb886-f258-4416-b227-7d1b726f400d', nickname: 'DENIS', full_name: 'Denis Derisvaldo' },
      { id: 'dacefd80-5a23-4ced-9dd1-f62511eadbac', nickname: 'GANSO', full_name: 'Anderson Xavier Silva' },
      { id: 'c784bf52-4b5e-49d6-8e3c-03dbfe586bdc', nickname: 'ARTHUR MACHADO', full_name: 'Arthur Machado da Costa' },
      { id: '20097329-3d34-4915-9b13-d946bbc0a981', nickname: 'TONY', full_name: 'Antoniony Laurentino da Silva' },
    ],
  },
  {
    name: 'POTE 2',
    players: [
      { id: 'ac034015-1e73-4970-a9bb-e238bf884ca7', nickname: 'VICENTE', full_name: 'Vicente da Silva Neto' },
      { id: '213001ec-4bc0-4ca3-b836-2b8d6c2c1df4', nickname: 'DIEGO AYALA', full_name: 'Diego Ayala Almeida' },
      { id: 'a39f11f4-7030-4bdd-9b4a-32668dda2f0c', nickname: 'IGOR RODRIGUES', full_name: 'Igor Rodrigues Alves' },
      { id: '7fd8aa72-f5ee-4799-ac9d-ec4aff68c058', nickname: 'MAYCON', full_name: 'Michael Douglas Monteiro de Freitas' },
      { id: '5b6daf92-0936-404c-bb15-9da33e074c54', nickname: 'LEO GOMES', full_name: 'Elielson Gomes de Paiva' },
      { id: '9c415beb-0c95-45ff-8f65-1b05afcab001', nickname: 'NESTOR', full_name: 'Nestor Soares' },
    ],
  },
  {
    name: 'POTE 3',
    players: [
      { id: 'a2aba834-509d-4bcf-99e6-f246773ea80e', nickname: 'ANDREZINHO', full_name: 'Andre Xavier da Silva' },
      { id: '79075fe5-9d60-4a10-ae7d-6e82cef28870', nickname: 'RONALDO', full_name: 'Ronaldo Cezar' },
      { id: '9125adeb-8bdb-40c3-babd-97d33337428b', nickname: 'TRINDADE', full_name: 'Marcus Vinicius Cardoso Trindade' },
      { id: 'a30bec68-7c62-47f0-bb34-ed24b1b9c73a', nickname: 'BIEL', full_name: 'Jesiel Biel' },
      { id: 'c554efad-c755-4943-8fc6-5737b53d9ab5', nickname: 'GILMAR', full_name: 'Gilmar Alves de Lima' },
      { id: '26f8f9b6-de7e-4b7e-97e2-36a61eadd194', nickname: 'MESSINHO', full_name: 'Emerson Bernardo' },
    ],
  },
  {
    name: 'POTE 4',
    players: [
      { id: 'ce923ead-b731-4971-a162-07b7ef46d053', nickname: 'ASSIS JR', full_name: 'Assis Junior' },
      { id: '2fae7d97-49bb-4cd1-b75f-b909af820e90', nickname: 'CLEBINHO', full_name: 'Cleberson Bernardo Neves' },
      { id: '3ae767b1-cc4a-4ce1-b1f0-ec40c3faa6c7', nickname: 'MORO', full_name: 'Gerfeson Martins' },
      { id: '311a182f-23eb-4f6c-aa27-febbc899282a', nickname: 'MARCELO DO POSTO', full_name: 'Marcelo do Posto' },
      { id: '39675523-1583-4e90-bdda-d32d81504316', nickname: 'JOAO MARCOS', full_name: 'Joao Marcus Barreto Lima' },
      { id: 'e38482c7-d9c5-4354-ad49-40f26368b90d', nickname: 'HUGO', full_name: 'Jose Hugo' },
    ],
  },
  {
    name: 'POTE 5',
    players: [
      { id: 'e5cfda3f-e391-4fef-ad8f-0fbfee89a3f6', nickname: 'JULIANDERSON', full_name: 'Julianderson Geraldo' },
      { id: '09e07f5e-8c8d-46fd-aef4-52211ed18092', nickname: 'JUAN', full_name: 'Juan Queiroz' },
      { id: 'e58668b9-fa5b-4a56-a821-42a2e577ab27', nickname: 'ALEX TRIGUEIRO', full_name: 'Allex Trigueiro Soares' },
      { id: '9e3f7d3d-b3d8-4af4-aff9-5b637698fd47', nickname: 'DANILO', full_name: 'Danilo Vieira Cesario' },
      { id: 'faea5f3b-ebc1-4984-9960-687aebee60f5', nickname: 'WENDELL', full_name: 'Wendell Rosa' },
      { id: '553a6ffd-e216-4f45-a268-9cf51b13fef4', nickname: 'RONAN SILVA', full_name: 'Ronan Silva' },
    ],
  },
  {
    name: 'POTE 6',
    players: [
      { id: '27edd3bb-5bef-4035-a699-daafee5926fc', nickname: 'CILINHO', full_name: 'Marcilio Cilinho' },
      { id: '0719993d-1bbf-4b85-b25e-525d957d0a20', nickname: 'JOAO MARIA', full_name: 'Joao Maria Alicate' },
      { id: 'a37152dd-419d-43f8-885a-a21ae2aefea9', nickname: 'MIKAEL FARIAS', full_name: 'Mikaell Farias Silva' },
      { id: '731f2a2b-dd21-4b8d-be30-7096f34c17fa', nickname: 'DINARTE', full_name: 'Dinarte da Silva Oliveira' },
      { id: '8d48bbb2-04ce-4779-b6de-f47d75b2deb0', nickname: 'ZE PEDRO', full_name: 'Ze Pedro da Silva' },
      { id: '03960e15-9a3f-4f75-9ba4-f38ef5489446', nickname: 'FABIANO SOBRINHO', full_name: 'Fabiano Sobrinho' },
    ],
  },
];

// All pot player IDs for quick lookup
export const POT_PLAYER_IDS = new Set(POTS.flatMap(p => p.players.map(pl => pl.id)));

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

export const NUM_TEAMS = 7;

export interface DraftPick {
  round: number;
  teamId: string;
  playerId: string;
  playerNickname: string;
  source: string; // pot name or position
  timestamp: number;
}

export interface DraftState {
  phase: 1 | 2;
  currentPotIndex: number;
  currentRound: number;
  currentTeamIndex: number;
  pickHistory: DraftPick[];
  roundOrders: string[][]; // team IDs in order for each round
  positionHistory: Record<string, number[]>; // teamId -> array of positions (0-based) they've had across odd rounds
  isStarted: boolean;
  isFinished: boolean;
  needsNewOrder: boolean;
}

export const INITIAL_DRAFT_STATE: DraftState = {
  phase: 1,
  currentPotIndex: 0,
  currentRound: 1,
  currentTeamIndex: 0,
  pickHistory: [],
  roundOrders: [],
  positionHistory: {},
  isStarted: false,
  isFinished: false,
  needsNewOrder: true,
};

export const DRAFT_STORAGE_KEY = 'supercopa-jiqui-draft-2026';

// Representatives already assigned to their teams (playerId -> { teamName, potName })
// These are pre-picked and should show as already chosen in the draft
export const PRE_ASSIGNED: { playerId: string; nickname: string; source: string }[] = [
  { playerId: '09cfb545-9807-47f3-82b6-1c42e8fd54db', nickname: 'ANDERSON VINGATOR', source: 'REPRESENTANTE' }, // Vingador FC
  { playerId: '213001ec-4bc0-4ca3-b836-2b8d6c2c1df4', nickname: 'DIEGO AYALA', source: 'POTE 2' },              // Real Madrid
  { playerId: '9c415beb-0c95-45ff-8f65-1b05afcab001', nickname: 'NESTOR', source: 'POTE 2' },                   // Seleção do Jiqui
  { playerId: 'a30bec68-7c62-47f0-bb34-ed24b1b9c73a', nickname: 'BIEL', source: 'POTE 3' },                     // Amigos do Jiqui
  { playerId: 'faea5f3b-ebc1-4984-9960-687aebee60f5', nickname: 'WENDELL', source: 'POTE 5' },                  // Santos
  { playerId: '8d48bbb2-04ce-4779-b6de-f47d75b2deb0', nickname: 'ZE PEDRO', source: 'POTE 6' },                 // Paçoca FC
];
