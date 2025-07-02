import React, { useState, useCallback, useEffect } from 'react';
import { Item, ItemName, GameResult, LocalGameState, MatchScore, GameMode, OnlineGameSession, OnlineGameState, PeerMessage, OnlinePlayer } from './types';
import { ITEMS } from './constants';
import { determineWinner } from './services/gameLogic';
import { getGeminiHand, getGeminiRoundPlay } from './services/geminiService';
import { getVictoryMessage } from './services/victoryMessages';
import peerService from './services/peerService';
import Scoreboard from './components/Scoreboard';
import ChoiceCircle from './components/ChoiceCircle';
import ResultDisplay from './components/ResultDisplay';
import ChoiceButton from './components/ChoiceButton';
import GameOverScreen from './components/GameOverScreen';
import OnlineLobby from './components/OnlineLobby';


const HAND_SIZE = 3;

const App: React.FC = () => {
  // Global App State
  const [gameMode, setGameMode] = useState<GameMode>('MENU');
  const [isLoading, setIsLoading] = useState(false);

  // Local Game State
  const [playerOverallScore, setPlayerOverallScore] = useState(0);
  const [computerOverallScore, setComputerOverallScore] = useState(0);
  const [rank, setRank] = useState(1000);
  const [previousRank, setPreviousRank] = useState(1000);
  const [localGameState, setLocalGameState] = useState<LocalGameState>('SELECTING_HAND');
  const [useGeminiAI, setUseGeminiAI] = useState(false);
  const [playerHand, setPlayerHand] = useState<Item[]>([]);
  const [computerHand, setComputerHand] = useState<Item[]>([]);
  const [playerPlayedChoices, setPlayerPlayedChoices] = useState<ItemName[]>([]);
  const [computerPlayedChoices, setComputerPlayedChoices] = useState<ItemName[]>([]);
  const [playerRoundChoice, setPlayerRoundChoice] = useState<Item | null>(null);
  const [computerRoundChoice, setComputerRoundChoice] = useState<Item | null>(null);
  const [roundResult, setRoundResult] = useState<GameResult | null>(null);
  const [resultMessage, setResultMessage] = useState<string>('');
  const [history, setHistory] = useState<ItemName[]>([]);
  const [matchScore, setMatchScore] = useState<MatchScore>({ player: 0, computer: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  
  // Online Game State
  const [onlineSession, setOnlineSession] = useState<OnlineGameSession | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // --- Effects for Online ---
   useEffect(() => {
    if (gameMode !== 'ONLINE') {
        peerService.destroy();
        return;
    }

    peerService.initialize(
        (id) => setPeerId(id),
        (data) => handlePeerData(data as PeerMessage),
        (connection) => {
             // Guest connected to host, host now sends the initial session
            if(onlineSession && onlineSession.hostId === peerId) {
                const guestPlayer: OnlinePlayer = { id: connection.peer, name: `Opponent`, hand: [], isHandConfirmed: false, playedChoices: [] };
                const updatedSession = { ...onlineSession, players: [...onlineSession.players, guestPlayer], gameState: 'SELECTING_HAND' as OnlineGameState };
                setOnlineSession(updatedSession);
                peerService.sendMessage({ type: 'SESSION_UPDATE', payload: updatedSession });
            }
        },
        () => { // on disconnected
            if(onlineSession) {
              setOnlineSession(s => s ? {...s, gameState: 'OPPONENT_DISCONNECTED'}: null);
              setError('Your opponent has disconnected.');
            }
        },
        (err) => setError(`Connection error: ${err.type}`)
    );

    return () => peerService.destroy();
  }, [gameMode]);
  
  const handleHostGame = () => {
    const player1: OnlinePlayer = { id: peerId, name: 'You', hand: [], isHandConfirmed: false, playedChoices: [] };
    const session: OnlineGameSession = {
      gameId: `game_${peerId}`,
      hostId: peerId,
      players: [player1],
      gameState: 'WAITING_FOR_OPPONENT',
      currentRound: 1,
      matchScore: {[peerId]: 0},
      roundChoices: {[peerId]: null},
      roundResult: null,
    };
    setOnlineSession(session);
  };
  
  const handleJoinGame = (opponentId: string) => {
      if(!peerId) {
          setError("Still initializing connection... please wait a moment.");
          return;
      }
      peerService.connect(opponentId);
      setIsLoading(true);
      // Session will be received from host via onData handler
  };

  const handlePeerData = (message: PeerMessage) => {
    const { type, payload } = message;
    if (type === 'SESSION_UPDATE') {
        setOnlineSession(payload);
        setIsLoading(false);
    } else if (type === 'HAND_CONFIRMED' || type === 'ROUND_PLAY') {
        // Host-specific logic is handled in the action handlers
        if (onlineSession?.hostId === peerId) {
            handleOpponentAction(type, payload);
        }
    }
  };

  const handleOpponentAction = (type: 'HAND_CONFIRMED' | 'ROUND_PLAY', payload: any) => {
    if (!onlineSession || onlineSession.hostId !== peerId) return;

    let updatedSession = { ...onlineSession };

    if (type === 'HAND_CONFIRMED') {
        const opponent = updatedSession.players.find(p => p.id !== peerId);
        if (opponent) {
            opponent.hand = payload.hand;
            opponent.isHandConfirmed = true;
        }
    } else if (type === 'ROUND_PLAY') {
         const opponent = updatedSession.players.find(p => p.id !== peerId);
         if(opponent) {
            updatedSession.roundChoices[opponent.id] = payload.choice;
         }
    }

    // Check if game state can advance
    updatedSession = advanceOnlineGameState(updatedSession);
    
    setOnlineSession(updatedSession);
    peerService.sendMessage({type: 'SESSION_UPDATE', payload: updatedSession});
  };
  
  // --- Local Game Handlers ---
  const handleToggleHandItem = useCallback((item: Item) => {
    setPlayerHand(prevHand => {
      const isInHand = prevHand.some(hItem => hItem.id === item.id);
      if (isInHand) {
        return prevHand.filter(hItem => hItem.id !== item.id);
      }
      if (prevHand.length < HAND_SIZE) {
        return [...prevHand, item];
      }
      return prevHand;
    });
  }, []);
  
  const handleConfirmHand = useCallback(async () => {
    if (playerHand.length !== HAND_SIZE) return;

    setIsLoading(true);
    
    let compHandNames: ItemName[];
    if (useGeminiAI) {
      compHandNames = await getGeminiHand(history);
    } else {
      const shuffled = [...ITEMS].sort(() => 0.5 - Math.random());
      compHandNames = shuffled.slice(0, HAND_SIZE).map(item => item.name);
    }
    const compHand = compHandNames.map(name => ITEMS.find(item => item.name === name)!).filter(Boolean);
    
    setComputerHand(compHand);
    setLocalGameState('MATCH_IN_PROGRESS');
    setIsLoading(false);

  }, [playerHand, useGeminiAI, history]);

  const handlePlayCard = useCallback(async (playerChoice: Item) => {
    if (isLoading || computerHand.length !== HAND_SIZE) return;
    
    setIsLoading(true);
    setPlayerRoundChoice(playerChoice);

    const playerRemainingNames = playerHand.filter(i => !playerPlayedChoices.includes(i.name)).map(i => i.name);
    const computerRemainingNames = computerHand.filter(i => !computerPlayedChoices.includes(i.name)).map(i => i.name);

    let compRoundChoiceName: ItemName;
    if (useGeminiAI) {
      compRoundChoiceName = await getGeminiRoundPlay(
        computerRemainingNames,
        playerRemainingNames,
        history,
        currentRound
      );
    } else {
      compRoundChoiceName = computerRemainingNames[Math.floor(Math.random() * computerRemainingNames.length)];
    }

    const compRoundChoice = ITEMS.find(item => item.name === compRoundChoiceName)!;
    setComputerRoundChoice(compRoundChoice);

    const gameResult = determineWinner(playerChoice, compRoundChoice);
    setRoundResult(gameResult);

    let message = '';
    if (gameResult === 'win') {
      setMatchScore(s => ({ ...s, player: s.player + 1 }));
      message = getVictoryMessage(playerChoice.name, compRoundChoice.name);
    } else if (gameResult === 'lose') {
      setMatchScore(s => ({ ...s, computer: s.computer + 1 }));
      message = getVictoryMessage(compRoundChoice.name, playerChoice.name);
    } else {
      message = "Stalemate! Both chose " + playerChoice.name + ".";
    }
    setResultMessage(message);

    setHistory(prev => [...prev, playerChoice.name]);
    setPlayerPlayedChoices(p => [...p, playerChoice.name]);
    setComputerPlayedChoices(c => [...c, compRoundChoice.name]);
    setLocalGameState('ROUND_OVER');
    setIsLoading(false);
  }, [computerHand, playerHand, useGeminiAI, history, isLoading, playerPlayedChoices, computerPlayedChoices, currentRound]);
  
  const handleNext = () => {
    if (gameMode === 'LOCAL') {
        if (currentRound === HAND_SIZE) {
            setPreviousRank(rank);
            if (matchScore.player > matchScore.computer) {
                setPlayerOverallScore(s => s + 1);
                setRank(r => r + 25);
                setLocalGameState('PLAYER_WINS');
            } else if (matchScore.computer > matchScore.player) {
                setComputerOverallScore(s => s + 1);
                setRank(r => (r - 15 > 0 ? r - 15 : 0));
                setLocalGameState('COMPUTER_WINS');
            } else {
                setLocalGameState('DRAW');
            }
        } else {
            setCurrentRound(r => r + 1);
            setLocalGameState('MATCH_IN_PROGRESS');
        }
        setPlayerRoundChoice(null);
        setComputerRoundChoice(null);
        setRoundResult(null);
    } else { // Online
        if (!onlineSession) return;
        let updatedSession = { ...onlineSession };
        if (updatedSession.currentRound === HAND_SIZE) {
            updatedSession.gameState = 'GAME_OVER';
        } else {
            updatedSession.gameState = 'MATCH_IN_PROGRESS';
            updatedSession.currentRound += 1;
            updatedSession.roundChoices = { [onlineSession.players[0].id]: null, [onlineSession.players[1].id]: null };
            updatedSession.roundResult = null;
        }
        setOnlineSession(updatedSession);
        peerService.sendMessage({ type: 'SESSION_UPDATE', payload: updatedSession });
    }
  };

  const handlePlayAgain = () => {
    // Reset local state
    setLocalGameState('SELECTING_HAND');
    setPlayerHand([]);
    setComputerHand([]);
    setPlayerPlayedChoices([]);
    setComputerPlayedChoices([]);
    setPlayerRoundChoice(null);
    setComputerRoundChoice(null);
    setRoundResult(null);
    setResultMessage('');
    setMatchScore({ player: 0, computer: 0 });
    setCurrentRound(1);
    setPreviousRank(rank);

    // Reset online state if applicable
    if (gameMode === 'ONLINE') {
        setGameMode('MENU');
        setOnlineSession(null);
        setError('');
    }
  };
  
    // --- Online Game Handlers ---
  const handleOnlineHandSelect = (item: Item) => {
    if (!onlineSession) return;
    const me = onlineSession.players.find(p => p.id === peerId);
    if (!me || me.isHandConfirmed) return;

    let newHand: ItemName[];
    if (me.hand.includes(item.name)) {
        newHand = me.hand.filter(name => name !== item.name);
    } else {
        if (me.hand.length < HAND_SIZE) {
            newHand = [...me.hand, item.name];
        } else {
            return;
        }
    }
    
    const updatedSession = { ...onlineSession };
    const myIndex = updatedSession.players.findIndex(p => p.id === peerId);
    updatedSession.players[myIndex].hand = newHand;
    setOnlineSession(updatedSession);
    // Don't sync yet, wait for confirmation
  };

  const handleOnlineHandConfirm = () => {
    if (!onlineSession) return;
    const me = onlineSession.players.find(p => p.id === peerId);
    if (!me || me.hand.length !== HAND_SIZE) return;
    
    let updatedSession = {...onlineSession};
    const myIndex = updatedSession.players.findIndex(p => p.id === peerId);
    updatedSession.players[myIndex].isHandConfirmed = true;

    if (onlineSession.hostId === peerId) { // I am the host
        // Check if game state can advance
        updatedSession = advanceOnlineGameState(updatedSession);
        setOnlineSession(updatedSession);
        peerService.sendMessage({type: 'SESSION_UPDATE', payload: updatedSession});
    } else { // I am the guest
        setOnlineSession(updatedSession);
        peerService.sendMessage({type: 'HAND_CONFIRMED', payload: { hand: me.hand }});
    }
  };
  
  const handleOnlinePlayCard = (item: Item) => {
    if (!onlineSession) return;
    const me = onlineSession.players.find(p => p.id === peerId);
    if (!me || onlineSession.roundChoices[me.id] !== null) return;
    
    let updatedSession = {...onlineSession};
    updatedSession.roundChoices[me.id] = item.name;

    if (onlineSession.hostId === peerId) {
        updatedSession = advanceOnlineGameState(updatedSession);
        setOnlineSession(updatedSession);
        peerService.sendMessage({type: 'SESSION_UPDATE', payload: updatedSession});
    } else {
        setOnlineSession(updatedSession);
        peerService.sendMessage({type: 'ROUND_PLAY', payload: { choice: item.name }});
    }
  };

  const advanceOnlineGameState = (session: OnlineGameSession): OnlineGameSession => {
      // Logic for host to advance game state
      if (session.hostId !== peerId) return session;

      const [p1, p2] = session.players;

      if (session.gameState === 'SELECTING_HAND' && p1.isHandConfirmed && p2.isHandConfirmed) {
          session.gameState = 'MATCH_IN_PROGRESS';
          session.roundChoices = { [p1.id]: null, [p2.id]: null };
      }
      
      if(session.gameState === 'MATCH_IN_PROGRESS' && session.roundChoices[p1.id] && session.roundChoices[p2.id]) {
          const choice1 = ITEMS.find(i => i.name === session.roundChoices[p1.id])!;
          const choice2 = ITEMS.find(i => i.name === session.roundChoices[p2.id])!;
          const result = determineWinner(choice1, choice2);
          
          let winnerId: string | null = null;
          if(result === 'win') {
              winnerId = p1.id;
              session.matchScore[p1.id] = (session.matchScore[p1.id] || 0) + 1;
          } else if (result === 'lose') {
              winnerId = p2.id;
              session.matchScore[p2.id] = (session.matchScore[p2.id] || 0) + 1;
          }
          
          session.roundResult = { winner: winnerId, result };
          p1.playedChoices.push(choice1.name);
          p2.playedChoices.push(choice2.name);
          session.gameState = 'ROUND_OVER';
      }
      return session;
  };

  // --- RENDER LOGIC ---
  const renderMenu = () => (
    <div className="text-center animate-reveal">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        Ultimate RPS-15
      </h1>
      <p className="text-gray-300 mt-4 text-lg">The ultimate test of skill and strategy.</p>
      <div className="mt-12 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
        <button
          onClick={() => setGameMode('LOCAL')}
          className="px-10 py-5 bg-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105"
        >
          Play Locally (vs AI)
        </button>
        <button
          onClick={() => setGameMode('ONLINE')}
          className="px-10 py-5 bg-indigo-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105"
        >
          Play Online (P2P)
        </button>
      </div>
    </div>
  );

  const renderOnlineGame = () => {
    if (!onlineSession) {
        return <OnlineLobby onHost={handleHostGame} onJoin={handleJoinGame} peerId={peerId} isLoading={isLoading} error={error}/>
    }

    const me = onlineSession.players.find(p => p.id === peerId);
    const opponent = onlineSession.players.find(p => p.id !== peerId);
    if (!me) return <p>Error: Could not find player in session.</p>;
    
    const myScore = onlineSession.matchScore[me.id] || 0;
    const opponentScore = opponent ? (onlineSession.matchScore[opponent.id] || 0) : 0;
    
    switch (onlineSession.gameState) {
      case 'WAITING_FOR_OPPONENT':
          return (
             <div className="text-center animate-reveal">
                <h2 className="text-3xl font-bold">Waiting for Opponent...</h2>
                <p className="text-gray-400 mt-2">Share this code with your friend:</p>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600 text-2xl font-mono tracking-widest text-yellow-300">
                    {peerId}
                </div>
            </div>
          );
      case 'SELECTING_HAND':
          const myHandItems = me.hand.map(name => ITEMS.find(i => i.name === name)!);
          return (
            <div className="flex flex-col items-center">
              <ChoiceCircle 
                items={ITEMS} 
                onToggleSelection={handleOnlineHandSelect} 
                selectedItems={myHandItems}
                disabled={me.isHandConfirmed}
                handSize={HAND_SIZE}
              />
              {me.isHandConfirmed ? (
                <p className="mt-8 text-2xl font-bold text-green-400 animate-pulse">Waiting for opponent to confirm hand...</p>
              ) : myHandItems.length === HAND_SIZE && (
                <button
                  onClick={handleOnlineHandConfirm}
                  className="mt-8 px-10 py-4 bg-green-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-green-500 transition-colors duration-300 transform hover:scale-105 animate-pulse-strong"
                >
                  CONFIRM HAND
                </button>
              )}
            </div>
          );
        case 'MATCH_IN_PROGRESS':
            const myCurrentHand = me.hand.map(name => ITEMS.find(i => i.name === name)!).filter(Boolean);
            const myPlayedOnline = me.playedChoices;
            const myChoiceThisRound = onlineSession.roundChoices[me.id];
            
            return (
                 <div className="flex flex-col items-center text-center animate-reveal space-y-6 md:space-y-8 w-full">
                    <Scoreboard playerScore={myScore} computerScore={opponentScore} rank={-1} playerLabel="YOU" computerLabel={opponent?.name ?? 'OPPONENT'} />
                    <div className="bg-gray-800/50 rounded-lg p-3 w-full max-w-sm">
                        <h2 className="text-2xl font-bold tracking-wider">ROUND {onlineSession.currentRound}/{HAND_SIZE}</h2>
                        <p className="text-xl font-semibold text-cyan-300">Match Score: {myScore} - {opponentScore}</p>
                    </div>
                    
                    <div className="w-full">
                      <h3 className="text-xl md:text-2xl font-bold mb-4">
                        {myChoiceThisRound ? 'WAITING FOR OPPONENT...' : 'CHOOSE YOUR MOVE'}
                      </h3>
                      <div className={`flex items-center justify-center space-x-2 md:space-x-4 transition-opacity ${myChoiceThisRound ? 'opacity-50' : ''}`}>
                        {myCurrentHand.map(item => {
                          const isPlayed = myPlayedOnline.includes(item.name);
                          return (
                            <div key={item.id} className={`relative transition-all duration-300 ${isPlayed ? 'opacity-30' : ''}`}>
                              <ChoiceButton item={item} onSelect={handleOnlinePlayCard} disabled={!!myChoiceThisRound || isPlayed} />
                               {isPlayed && <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-red-500/80">X</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                 </div>
            );
        case 'ROUND_OVER':
            if (!opponent || !onlineSession.roundResult || onlineSession.roundChoices[me.id] === null || onlineSession.roundChoices[opponent.id] === null) return <p>Waiting for round results...</p>;
            
            const myChoiceItem = ITEMS.find(i => i.name === onlineSession.roundChoices[me.id])!;
            const opponentChoiceItem = ITEMS.find(i => i.name === onlineSession.roundChoices[opponent.id])!;
            
            const myResult: GameResult = onlineSession.roundResult.winner === null ? 'draw' : onlineSession.roundResult.winner === me.id ? 'win' : 'lose';

            return (
                <div className="w-full flex flex-col items-center">
                    <Scoreboard playerScore={myScore} computerScore={opponentScore} rank={-1} playerLabel="YOU" computerLabel={opponent?.name ?? 'OPPONENT'}/>
                    <ResultDisplay 
                        playerChoice={myChoiceItem} 
                        computerChoice={opponentChoiceItem}
                        result={myResult}
                        resultMessage={myResult === 'win' ? getVictoryMessage(myChoiceItem.name, opponentChoiceItem.name) : myResult === 'lose' ? getVictoryMessage(opponentChoiceItem.name, myChoiceItem.name) : "Stalemate!"}
                        onNextRound={handleNext}
                        playerHand={me.hand.map(n => ITEMS.find(i => i.name === n)!)}
                        computerHand={opponent.hand.map(n => ITEMS.find(i => i.name === n)!)}
                        matchScore={{player: myScore, computer: opponentScore}}
                        round={onlineSession.currentRound}
                        isOnline={true}
                        playerLabel="YOU"
                        opponentLabel="OPPONENT"
                    />
                </div>
            )
        case 'GAME_OVER':
             const finalMyScore = onlineSession.matchScore[me.id] || 0;
             const finalOpponentScore = opponent ? (onlineSession.matchScore[opponent.id] || 0) : 0;
             const finalResult: GameResult = finalMyScore > finalOpponentScore ? 'win' : finalMyScore < finalOpponentScore ? 'lose' : 'draw';
             return <GameOverScreen result={finalResult} matchScore={{player: finalMyScore, computer: finalOpponentScore}} onPlayAgain={handlePlayAgain} isOnline={true} />
        case 'OPPONENT_DISCONNECTED':
             return <div className="text-center animate-reveal"><h2 className="text-4xl text-red-500 font-bold">Opponent Disconnected</h2><p className="mt-4">{error}</p><button onClick={handlePlayAgain} className="mt-8 px-10 py-4 bg-indigo-600 text-white font-bold text-xl rounded-lg">MAIN MENU</button></div>
      default:
        return <p>Unknown online game state: {onlineSession.gameState}</p>;
    }
  }

  const renderLocalGame = () => {
    switch (localGameState) {
      case 'SELECTING_HAND':
        return (
          <div className="flex flex-col items-center">
            <header className="w-full text-center mb-6">
                 <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                    Ultimate RPS-15
                </h1>
                <p className="text-gray-400 mt-2">Win the best-of-three match to prove your skill.</p>
            </header>
            <div className="mb-8 w-full">
                <Scoreboard playerScore={playerOverallScore} computerScore={computerOverallScore} rank={rank} />
            </div>
            <ChoiceCircle 
              items={ITEMS} 
              onToggleSelection={handleToggleHandItem} 
              selectedItems={playerHand}
              disabled={isLoading}
              handSize={HAND_SIZE}
            />
            {playerHand.length === HAND_SIZE && (
              <button
                onClick={handleConfirmHand}
                disabled={isLoading}
                className={`mt-8 px-10 py-4 bg-green-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-green-500 transition-colors duration-300 transform hover:scale-105 ${isLoading ? 'animate-pulse' : 'animate-pulse-strong'}`}
              >
                {isLoading ? 'AI IS CHOOSING...' : 'CONFIRM HAND'}
              </button>
            )}
             <footer className="w-full max-w-md text-center mt-8">
                 <div className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-center space-x-4">
                    <span className={`font-bold transition-colors ${!useGeminiAI ? 'text-white' : 'text-gray-500'}`}>Standard AI</span>
                    <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="ai-toggle" 
                        className="sr-only peer"
                        checked={useGeminiAI}
                        onChange={() => setUseGeminiAI(!useGeminiAI)}
                        disabled={localGameState !== 'SELECTING_HAND'}
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-500/50 peer-checked:bg-purple-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                    <span className={`font-bold transition-colors ${useGeminiAI ? 'text-white' : 'text-gray-500'}`}>Gemini AI</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Toggle for a more challenging opponent. Can only be changed before a match.</p>
            </footer>
          </div>
        );
      
      case 'MATCH_IN_PROGRESS':
        return (
          <div className="flex flex-col items-center text-center animate-reveal space-y-6 md:space-y-8 w-full">
            <Scoreboard playerScore={playerOverallScore} computerScore={computerOverallScore} rank={rank} />
            <div className="bg-gray-800/50 rounded-lg p-3 w-full max-w-sm">
                <h2 className="text-2xl font-bold tracking-wider">ROUND {currentRound}/{HAND_SIZE}</h2>
                <p className="text-xl font-semibold text-cyan-300">Match Score: {matchScore.player} - {matchScore.computer}</p>
            </div>
            
            <div className="w-full">
              <h3 className="text-xl md:text-2xl font-bold mb-4">
                 {isLoading ? 'AI IS THINKING...' : 'CHOOSE YOUR MOVE'}
              </h3>
              <div className={`flex items-center justify-center space-x-2 md:space-x-4 transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                {playerHand.map(item => {
                  const isPlayed = playerPlayedChoices.includes(item.name);
                  return (
                    <div key={item.id} className={`relative transition-all duration-300 ${isPlayed ? 'opacity-30' : ''}`}>
                      <ChoiceButton item={item} onSelect={handlePlayCard} disabled={isLoading || isPlayed} />
                       {isPlayed && <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-red-500/80">X</div>}
                    </div>
                  );
                })}
              </div>
            </div>

             <div>
                <h3 className="text-lg font-bold mb-2 text-gray-400">AI'S REMAINING HAND</h3>
                <div className="flex items-center justify-center space-x-2 md:space-x-4">
                    {[...Array(HAND_SIZE - computerPlayedChoices.length)].map((_, index) => (
                    <div key={index} className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-700 flex items-center justify-center border-4 border-white/30 shadow-lg">
                        <span className="text-3xl text-purple-400">?</span>
                    </div>
                    ))}
                </div>
            </div>
          </div>
        );

      case 'ROUND_OVER':
        if (!playerRoundChoice || !computerRoundChoice || !roundResult || !computerHand.length) return null;
        return (
          <>
            <Scoreboard playerScore={playerOverallScore} computerScore={computerOverallScore} rank={rank} />
            <ResultDisplay 
                playerChoice={playerRoundChoice} 
                computerChoice={computerRoundChoice}
                result={roundResult}
                resultMessage={resultMessage}
                onNextRound={handleNext}
                playerHand={playerHand}
                computerHand={computerHand}
                matchScore={matchScore}
                round={currentRound}
            />
          </>
        );
        
      case 'PLAYER_WINS':
        return <GameOverScreen result="win" matchScore={matchScore} onPlayAgain={handlePlayAgain} oldRank={previousRank} newRank={rank} />
      case 'COMPUTER_WINS':
        return <GameOverScreen result="lose" matchScore={matchScore} onPlayAgain={handlePlayAgain} oldRank={previousRank} newRank={rank} />
      case 'DRAW':
        return <GameOverScreen result="draw" matchScore={matchScore} onPlayAgain={handlePlayAgain} oldRank={previousRank} newRank={rank} />
        
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (gameMode) {
        case 'MENU': return renderMenu();
        case 'LOCAL': return renderLocalGame();
        case 'ONLINE': return renderOnlineGame();
        default: return <p>Invalid game mode.</p>
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 to-indigo-900/50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
        {renderContent()}
      </main>
      <button onClick={() => {setGameMode('MENU'); handlePlayAgain();}} className="absolute top-4 left-4 px-3 py-1 bg-gray-700/50 rounded-md hover:bg-gray-600 transition-colors">
        Main Menu
      </button>
    </div>
  );
};

export default App;
