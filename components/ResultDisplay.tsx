import React from 'react';
import { Item, GameResult, MatchScore } from '../types';

interface ResultDisplayProps {
  playerChoice: Item;
  computerChoice: Item;
  result: GameResult;
  resultMessage: string;
  onNextRound: () => void;
  playerHand: Item[];
  computerHand: Item[];
  matchScore: MatchScore;
  round: number;
  isOnline?: boolean;
  playerLabel?: string;
  opponentLabel?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  playerChoice,
  computerChoice,
  result,
  resultMessage,
  onNextRound,
  playerHand,
  computerHand,
  matchScore,
  round,
  isOnline = false,
  playerLabel = "YOU",
  opponentLabel = "AI"
}) => {
  const resultColors: Record<GameResult, string> = {
    win: 'text-green-400 border-green-400',
    lose: 'text-red-400 border-red-400',
    draw: 'text-gray-400 border-gray-400',
  };

  const titleText = result === 'win' ? `ROUND ${round} - WIN` : result === 'lose' ? `ROUND ${round} - LOSE` : `ROUND ${round} - DRAW`;
  const titleColor = resultColors[result];

  const ChoiceDisplay: React.FC<{ choice: Item; label: string; highlight: boolean }> = ({ choice, label, highlight }) => (
    <div className="flex flex-col items-center space-y-2">
      <p className="text-xl font-bold">{label}</p>
      <div className={`
        ${choice.color} 
        w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center 
        text-5xl md:text-6xl border-8
        ${highlight ? 'border-yellow-300 animate-pulse-strong' : 'border-white/50'}
        transition-all duration-500
      `}>
        {choice.icon}
      </div>
      <p className="text-lg font-semibold">{choice.name}</p>
    </div>
  );
  
  const HandDisplay: React.FC<{ hand: Item[]; playedItem: Item; label: string; }> = ({ hand, playedItem, label }) => (
    <div className="flex flex-col items-center space-y-3">
        <p className="font-bold text-gray-400">{label}</p>
        <div className="flex space-x-2 p-2 bg-gray-800/50 rounded-lg">
            {hand.map(item => (
                <div key={item.id} className={`
                    ${item.color} w-12 h-12 rounded-full flex items-center justify-center text-xl
                    border-2
                    ${item.id === playedItem.id ? 'border-yellow-400 scale-110' : 'border-transparent opacity-50'}
                    transition-all duration-300
                `}>
                    {item.icon}
                </div>
            ))}
        </div>
    </div>
  );
  
  const buttonText = (isOnline && round === 3) || (!isOnline && round === 3) ? 'VIEW RESULTS' : 'NEXT ROUND';

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 animate-reveal space-y-6 w-full">
      <div className="flex items-center justify-around w-full max-w-2xl">
        <ChoiceDisplay choice={playerChoice} label={`${playerLabel} PLAYED`} highlight={result === 'win'} />
        <p className="text-4xl font-black mx-4">VS</p>
        <ChoiceDisplay choice={computerChoice} label={`${opponentLabel} PLAYED`} highlight={result === 'lose'} />
      </div>

      <div className="h-28 flex flex-col items-center justify-center text-center">
        <h2 className={`text-4xl md:text-6xl font-extrabold tracking-wider ${titleColor}`}>
          {titleText}
        </h2>
        <p className="mt-2 text-2xl font-bold text-white">
          Match Score: {matchScore.player} - {matchScore.computer}
        </p>
        <div className="mt-2 h-6">
          <p className="text-lg italic text-yellow-200">{resultMessage}</p>
        </div>
      </div>
      
       <div className="w-full max-w-lg bg-gray-900/70 border border-gray-700 rounded-xl p-4 space-y-4">
          <HandDisplay hand={playerHand} playedItem={playerChoice} label="YOUR HAND" />
          <div className="border-t border-gray-600 my-2"></div>
          <HandDisplay hand={computerHand} playedItem={computerChoice} label={`${opponentLabel}'S HAND`} />
      </div>

      <button
        onClick={onNextRound}
        className="mt-4 px-10 py-4 bg-indigo-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-indigo-500 transition-colors duration-300 transform hover:scale-105"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default ResultDisplay;