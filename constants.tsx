
import React from 'react';
import { Item, ItemName } from './types';

const EMOJI_MAP: Record<ItemName, React.ReactNode> = {
    Rock: <span role="img" aria-label="Rock">✊</span>,
    Gun: <span role="img" aria-label="Gun">👉</span>,
    Lightning: <span role="img" aria-label="Lightning">⚡️</span>,
    Devil: <span role="img" aria-label="Devil">😈</span>,
    Dragon: <span role="img" aria-label="Dragon">🐉</span>,
    Water: <span role="img" aria-label="Water">💧</span>,
    Air: <span role="img" aria-label="Air">💨</span>,
    Paper: <span role="img" aria-label="Paper">✋</span>,
    Sponge: <span role="img" aria-label="Sponge">🧽</span>,
    Wolf: <span role="img" aria-label="Wolf">🐺</span>,
    Tree: <span role="img" aria-label="Tree">🌳</span>,
    Human: <span role="img" aria-label="Human">🙋</span>,
    Snake: <span role="img" aria-label="Snake">🐍</span>,
    Scissors: <span role="img" aria-label="Scissors">✌️</span>,
    Fire: <span role="img" aria-label="Fire">🔥</span>,
};

// Clockwise order from the image
export const ITEMS: Item[] = [
  { id: 0, name: 'Rock', color: 'bg-green-600', icon: EMOJI_MAP['Rock'] },
  { id: 1, name: 'Gun', color: 'bg-gray-500', icon: EMOJI_MAP['Gun'] },
  { id: 2, name: 'Lightning', color: 'bg-pink-400', icon: EMOJI_MAP['Lightning'] },
  { id: 3, name: 'Devil', color: 'bg-purple-600', icon: EMOJI_MAP['Devil'] },
  { id: 4, name: 'Dragon', color: 'bg-red-700', icon: EMOJI_MAP['Dragon'] },
  { id: 5, name: 'Water', color: 'bg-blue-600', icon: EMOJI_MAP['Water'] },
  { id: 6, name: 'Air', color: 'bg-cyan-300', icon: EMOJI_MAP['Air'] },
  { id: 7, name: 'Paper', color: 'bg-pink-300', icon: EMOJI_MAP['Paper'] },
  { id: 8, name: 'Sponge', color: 'bg-red-400', icon: EMOJI_MAP['Sponge'] },
  { id: 9, name: 'Wolf', color: 'bg-yellow-800', icon: EMOJI_MAP['Wolf'] },
  { id: 10, name: 'Tree', color: 'bg-green-800', icon: EMOJI_MAP['Tree'] },
  { id: 11, name: 'Human', color: 'bg-orange-600', icon: EMOJI_MAP['Human'] },
  { id: 12, name: 'Snake', color: 'bg-yellow-500', icon: EMOJI_MAP['Snake'] },
  { id: 13, name: 'Scissors', color: 'bg-orange-400', icon: EMOJI_MAP['Scissors'] },
  { id: 14, name: 'Fire', color: 'bg-yellow-300', icon: EMOJI_MAP['Fire'] },
];
