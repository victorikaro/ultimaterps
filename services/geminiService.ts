import { GoogleGenAI } from "@google/genai";
import { ItemName, ITEM_NAMES } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const model = 'gemini-2.5-flash-preview-04-17';

/**
 * Gets a strategic hand of 3 items for the AI.
 * @param history The player's recent move history.
 * @returns A promise that resolves to an array of 3 ItemNames.
 */
export const getGeminiHand = async (history: ItemName[]): Promise<ItemName[]> => {
  const historyString = history.length > 0 ? `The player's last 5 moves were: ${history.slice(-5).join(', ')}.` : "This is the first round.";
  
  const prompt = `You are playing an advanced version of Rock-Paper-Scissors with these 15 options: ${ITEM_NAMES.join(', ')}.
${historyString}
Your goal is to build a strategic hand of THREE (3) distinct items to counter the user's likely pattern.
Choose three and only three options from the list.
Return the three items as a comma-separated list. Do not add any explanation or other text.
Example: Rock, Paper, Scissors`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    
    const text = response.text.trim();
    const potentialItems = text.split(',').map(name => name.trim());
    
    const chosenItems = potentialItems
      .map(pItem => ITEM_NAMES.find(name => name === pItem))
      .filter((item): item is ItemName => !!item);
      
    const finalHand: ItemName[] = [...new Set(chosenItems)];

    if (finalHand.length >= 3) {
      return finalHand.slice(0, 3);
    } else {
      console.warn("Gemini did not return 3 valid items for a hand. Filling randomly.", text);
      while(finalHand.length < 3) {
          const randomItem = ITEM_NAMES[Math.floor(Math.random() * ITEM_NAMES.length)];
          if (!finalHand.includes(randomItem)) {
              finalHand.push(randomItem);
          }
      }
      return finalHand;
    }
  } catch (error) {
    console.error("Error fetching Gemini hand:", error);
    // Fallback to random hand on API error
    const randomHand: ItemName[] = [];
    const availableItems = [...ITEM_NAMES];
    while (randomHand.length < 3 && availableItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        randomHand.push(availableItems.splice(randomIndex, 1)[0]);
    }
    return randomHand;
  }
};

/**
 * Given the AI's remaining hand and player's remaining hand, chooses a card for the current round.
 * @param aiHand The AI's current REMAINING hand.
 * @param playerHand The player's current REMAINING hand.
 * @param history The player's overall recent move history.
 * @param round The current round number (1, 2, or 3).
 * @returns A promise that resolves to the ItemName the AI will play.
 */
export const getGeminiRoundPlay = async (
    aiHand: ItemName[], 
    playerHand: ItemName[], 
    history: ItemName[],
    round: number
): Promise<ItemName> => {
  const historyString = history.length > 0 ? `The player's overall play history is: ${history.slice(-5).join(', ')}.` : "This is the first match.";
  
  const prompt = `You are in round ${round} of a 3-round match of advanced Rock-Paper-Scissors.
Your remaining cards are: ${aiHand.join(', ')}.
The player's remaining cards are: ${playerHand.join(', ')}.
${historyString}

Based on the player's remaining cards and their history, predict which of THEIR cards they are most likely to play this round.
Then, from YOUR remaining cards, choose the best item to counter their predicted move.
Return only the single item name from YOUR hand that you choose to play. Do not add any explanation.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    
    const text = response.text.trim();
    const chosenItem = aiHand.find(name => text.includes(name));
    
    if (chosenItem) {
      return chosenItem;
    } else {
      console.warn("Gemini response was not a valid item from its hand, choosing randomly from hand.", text);
      return aiHand[Math.floor(Math.random() * aiHand.length)];
    }
  } catch (error) {
    console.error("Error fetching Gemini round play:", error);
    // Fallback to random choice from hand on API error
    return aiHand[Math.floor(Math.random() * aiHand.length)];
  }
};