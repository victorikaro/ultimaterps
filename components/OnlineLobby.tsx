import React, { useState } from 'react';

interface OnlineLobbyProps {
  onHost: () => void;
  onJoin: (id: string) => void;
  peerId: string | null;
  isLoading: boolean;
  error: string;
}

const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onHost, onJoin, peerId, isLoading, error }) => {
  const [opponentId, setOpponentId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = () => {
    if (opponentId.trim()) {
      onJoin(opponentId.trim());
    }
  };
  
  const handleCopyToClipboard = () => {
    if (peerId) {
        navigator.clipboard.writeText(peerId);
        // Add some feedback to the user
    }
  }

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 animate-reveal w-full max-w-lg">
      <h2 className="text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
        Play Online
      </h2>
      <p className="text-gray-400 mt-2">Connect directly with a friend. No server, no sign-up.</p>

      {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
      
      <div className="mt-8 w-full p-6 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
        <h3 className="text-2xl font-semibold">Host a Game</h3>
        <p className="text-sm text-gray-400">Click Host and share your Game Code with a friend.</p>
        {peerId ? (
            <div className="flex items-center space-x-2">
                <p className="p-3 bg-gray-900 rounded-lg text-lg font-mono text-yellow-300 flex-grow">{peerId}</p>
                <button onClick={handleCopyToClipboard} className="p-3 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
            </div>
        ) : (
            <div className="h-14 flex items-center justify-center"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div></div>
        )}
        <button
          onClick={onHost}
          disabled={!peerId || isLoading}
          className="w-full px-8 py-3 bg-cyan-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-cyan-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Host New Game'}
        </button>
      </div>

      <div className="w-full my-6 text-center text-gray-500 font-bold">OR</div>
      
      <div className="w-full p-6 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
        <h3 className="text-2xl font-semibold">Join a Game</h3>
        <p className="text-sm text-gray-400">Enter your friend's Game Code to connect.</p>
        <input
          type="text"
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          placeholder="Enter Game Code"
          className="w-full p-3 bg-gray-900 rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
        />
        <button
          onClick={handleJoin}
          disabled={!opponentId.trim() || isLoading}
          className="w-full px-8 py-3 bg-indigo-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Join Game'}
        </button>
      </div>
    </div>
  );
};

export default OnlineLobby;
