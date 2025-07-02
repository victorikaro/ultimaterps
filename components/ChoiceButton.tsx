import React from 'react';
import { Item } from '../types.ts';

interface ChoiceButtonProps {
  item: Item;
  onSelect: (item: Item) => void;
  disabled?: boolean;
  size?: 'small' | 'large';
  isSelected?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ item, onSelect, disabled = false, size = 'large', isSelected = false }) => {
  const sizeClasses = size === 'large' 
    ? "w-20 h-20 md:w-24 md:h-24 text-3xl md:text-4xl" 
    : "w-16 h-16 text-2xl";

  return (
    <button
      onClick={() => onSelect(item)}
      disabled={disabled}
      className={`
        ${item.color} 
        ${sizeClasses}
        rounded-full flex flex-col items-center justify-center 
        font-bold text-white shadow-lg transition-all duration-300 ease-in-out
        transform hover:scale-110 hover:shadow-2xl focus:outline-none 
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg
        border-4 ${isSelected ? 'border-yellow-400 ring-4 ring-yellow-400/50' : 'border-white/50'}
      `}
      style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}
    >
      <div className="transform scale-125">{item.icon}</div>
    </button>
  );
};

export default ChoiceButton;