
import { Item, GameResult } from '../types.ts';

/**
 * Determines the winner between two choices in the 15-item Rock-Paper-Scissors game.
 * The rule: A choice wins if its opponent is one of the 7 items that come *before* it in the circle (counter-clockwise).
 * @param playerChoice The player's selected item.
 * @param computerChoice The computer's selected item.
 * @returns 'win', 'lose', or 'draw'.
 */
export function determineWinner(playerChoice: Item, computerChoice: Item): GameResult {
  if (playerChoice.id === computerChoice.id) {
    return 'draw';
  }

  const difference = (playerChoice.id - computerChoice.id + 15) % 15;

  // A player wins if the difference is between 1 and 7 (inclusive).
  // This corresponds to the 7 items that the player's choice defeats.
  if (difference > 0 && difference <= 7) {
    return 'win';
  } else {
    return 'lose';
  }
}