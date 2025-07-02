import React from 'react';
import { Item } from '../types';
import ChoiceButton from './ChoiceButton';

interface ChoiceCircleProps {
  items: Item[];
  onToggleSelection: (item: Item) => void;
  selectedItems: Item[];
  disabled: boolean;
  handSize: number;
}

const ChoiceCircle: React.FC<ChoiceCircleProps> = ({ items, onToggleSelection, selectedItems, disabled, handSize }) => {
  const circleRadius = 180; // pixels for large screens
  const mobileRadius = 130; // pixels for small screens

  return (
    <div className="flex flex-col items-center justify-center my-8 animate-reveal">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-wider text-center">
        CHOOSE YOUR HAND ({selectedItems.length}/{handSize})
      </h2>
      <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
        {items.map((item, i) => {
          const angle = (i / items.length) * 2 * Math.PI - Math.PI / 2; // Subtract PI/2 to start from top
          const x = Math.cos(angle);
          const y = Math.sin(angle);
          const isSelected = selectedItems.some(selected => selected.id === item.id);
          const isFull = selectedItems.length >= handSize;
          
          return (
            <div
              key={item.id}
              className="absolute transition-transform duration-300"
              style={{
                transform: `translate(calc(${x * 100}% + ${x * mobileRadius}px), calc(${y * 100}% + ${y * mobileRadius}px))`,
              }}
            >
              <div className="hidden md:block" style={{ transform: `translate(${-x*100}%, ${-y*100}%)`, transition: 'transform 0.3s', transformOrigin: 'center' }}>
                 <div style={{ transform: `translate(calc(${x * (circleRadius - mobileRadius)}px), calc(${y * (circleRadius-mobileRadius)}px))` }}>
                    <ChoiceButton item={item} onSelect={onToggleSelection} disabled={disabled || (!isSelected && isFull)} isSelected={isSelected} />
                 </div>
              </div>
               <div className="block md:hidden">
                  <ChoiceButton item={item} onSelect={onToggleSelection} disabled={disabled || (!isSelected && isFull)} size="small" isSelected={isSelected}/>
               </div>
            </div>
          );
        })}
        <div className="text-center">
            {/* Center is clear for the confirm button in App.tsx */}
        </div>
      </div>
    </div>
  );
};

export default ChoiceCircle;
