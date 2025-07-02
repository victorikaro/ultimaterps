import React from 'react';

interface ScoreboardProps {
  playerScore: number;
  computerScore: number;
  rank: number;
  playerLabel?: string;
  computerLabel?: string;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ playerScore, computerScore, rank, playerLabel = "PLAYER", computerLabel = "COMPUTER" }) => {
  const showRank = rank !== -1;
  const gridCols = showRank ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg border border-gray-700">
      <div className={`grid ${gridCols} divide-x divide-gray-600 text-center`}>
        <div className="px-2">
          <p className="text-sm md:text-lg font-semibold text-cyan-400">{playerLabel}</p>
          <p className="text-2xl md:text-4xl font-bold tracking-tighter">{playerScore}</p>
        </div>
        {showRank && (
            <div className="px-2">
                <p className="text-sm md:text-lg font-semibold text-gray-400">RANK</p>
                <p className="text-2xl md:text-4xl font-bold tracking-tighter">{rank}</p>
            </div>
        )}
        <div className="px-2">
          <p className="text-sm md:text-lg font-semibold text-red-400">{computerLabel}</p>
          <p className="text-2xl md:text-4xl font-bold tracking-tighter">{computerScore}</p>
        </div>
      </div>
    </div>
  );
};

export default Scoreboard;