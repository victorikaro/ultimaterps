
import { Item, GameResult } from '../types';


export function determineWinner(playerChoice: Item, computerChoice: Item): GameResult {
  if (playerChoice.id === computerChoice.id) {
    return 'draw';
  }

  const difference = (playerChoice.id - computerChoice.id + 15) % 15;

  if (difference > 0 && difference <= 7) {
    return 'win';
  } else {
    return 'lose';
  }
}
