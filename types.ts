import { ReactNode } from 'react';

export const ITEM_NAMES = [
    'Rock', 'Gun', 'Lightning', 'Devil', 'Dragon', 'Water', 'Air', 'Paper', 
    'Sponge', 'Wolf', 'Tree', 'Human', 'Snake', 'Scissors', 'Fire'
] as const;

export type ItemName = typeof ITEM_NAMES[number];

export interface Item {
  id: number;
  name: ItemName;
  color: string;
  icon: ReactNode;
}

export type GameResult = 'win' | 'lose' | 'draw';

// --- Game Modes ---
export type GameMode = 'MENU' | 'LOCAL' | 'ONLINE';

// --- Local Game ---
export type LocalGameState = 'SELECTING_HAND' | 'MATCH_IN_PROGRESS' | 'ROUND_OVER' | 'PLAYER_WINS' | 'COMPUTER_WINS' | 'DRAW';
export type MatchScore = { player: number; computer: number };

// --- Online P2P Game ---
export type OnlineGameState = 
  | 'LOBBY' 
  | 'HOSTING'
  | 'CONNECTING'
  | 'WAITING_FOR_OPPONENT'
  | 'SELECTING_HAND'
  | 'WAITING_FOR_HAND'
  | 'MATCH_IN_PROGRESS'
  | 'WAITING_FOR_PLAY'
  | 'ROUND_OVER'
  | 'GAME_OVER'
  | 'OPPONENT_DISCONNECTED';

export interface OnlinePlayer {
  id: string; // PeerJS ID
  name: string;
  hand: ItemName[];
  playedChoices: ItemName[];
  isHandConfirmed: boolean;
}

export interface OnlineGameSession {
  gameId: string;
  hostId: string;
  players: OnlinePlayer[];
  gameState: OnlineGameState;
  currentRound: number;
  matchScore: { [playerId: string]: number };
  roundChoices: { [playerId: string]: ItemName | null };
  roundResult: { winner: string | null, result: GameResult } | null; // winner is player ID
}

// --- P2P Communication ---
export interface PeerMessage {
    type: 'SESSION_UPDATE' | 'HAND_CONFIRMED' | 'ROUND_PLAY';
    payload: any;
}
