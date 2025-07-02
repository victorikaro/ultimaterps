import React from 'react';
import { MatchScore } from '../types.ts';

interface GameOverScreenProps {
  result: 'win' | 'lose' | 'draw';
  matchScore: MatchScore;
  onPlayAgain: () => void;
  oldRank?: number;
  newRank?: number;
  isOnline?: boolean;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ result, matchScore, onPlayAgain, oldRank, newRank, isOnline = false }) => {
  const config = {
    win: {
      title: 'VICTORY!',
      color: 'text-green-400',
      borderColor: 'border-green-400',
      shadowColor: 'shadow-green-500/50',
      message: 'You have proven your strategic superiority.',
    },
    lose: {
      title: 'DEFEAT',
      color: 'text-red-400',
      borderColor: 'border-red-400',
      shadowColor: 'shadow-red-500/50',
      message: "Your opponent's logic has bested you. Re-strategize.",
    },
    draw: {
      title: 'STALEMATE',
      color: 'text-gray-400',
      borderColor: 'border-gray-400',
      shadowColor: 'shadow-gray-500/50',
      message: 'A perfect match of wits. Neither could claim victory.',
    },
  };

  const { title, color, borderColor, shadowColor, message } = config[result];
  const rankChange = newRank !== undefined && oldRank !== undefined ? newRank - oldRank : 0;
  const rankChangeSign = rankChange > 0 ? '+' : '';
  const rankChangeColor = rankChange > 0 ? 'text-green-400' : rankChange < 0 ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 animate-reveal space-y-6 w-full max-w-md mx-auto bg-gray-800/60 backdrop-blur-md rounded-2xl border ${borderColor} shadow-2xl ${shadowColor}`}>
      <h1 className={`text-6xl md:text-8xl font-extrabold tracking-wider ${color}`}>
        {title}
      </h1>
      <p className="text-xl text-gray-200">{message}</p>
      
      <div className="text-center bg-gray-900/50 p-4 rounded-lg w-full">
        <p className="text-lg font-semibold text-gray-400">FINAL SCORE</p>
        <p className="text-5xl font-bold tracking-tighter">
          <span className="text-cyan-400">{matchScore.player}</span>
          <span className="text-gray-500 mx-2">-</span>
          <span className="text-red-400">{matchScore.computer}</span>
        </p>
      </div>

      {!isOnline && oldRank !== undefined && newRank !== undefined && (
        <div className="text-center bg-gray-900/50 p-4 rounded-lg w-full">
            <p className="text-lg font-semibold text-gray-400">RANK CHANGE</p>
            <p className="text-3xl font-bold tracking-tighter text-gray-300">
                {oldRank}
                <span className="text-2xl mx-2">→</span>
                {newRank}
                <span className={`ml-2 text-2xl font-bold ${rankChangeColor}`}>
                    ({rankChangeSign}{rankChange})
                </span>
            </p>
        </div>
      )}
      
      <button
        onClick={onPlayAgain}
        className="mt-4 px-10 py-4 bg-indigo-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-indigo-500 transition-colors duration-300 transform hover:scale-105 animate-pulse-strong"
      >
        {isOnline ? 'RETURN TO MENU' : 'PLAY NEW MATCH'}
      </button>
    </div>
  );
};

export default GameOverScreen;