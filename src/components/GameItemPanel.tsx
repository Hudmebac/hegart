import React from 'react';
import { GameItem, Weapon, Accessory } from '../types/game'; // Adjust the import path as necessary

interface GameItemPanelProps {
  items: GameItem[];
  onEquipItem: (itemId: string) => void;
}

const GameItemPanel: React.FC<GameItemPanelProps> = ({ items, onEquipItem }) => {
  return (
    <div className="game-item-panel">
      <h3>Available Items</h3>
      <ul>
        {items.map(item => (
          <li key={item.id} onClick={() => onEquipItem(item.id)}>
            <strong>{item.name}</strong> ({item.type})
            {item.type === 'weapon' && <span> - Damage: {(item as Weapon).damage}</span>}
            {item.type === 'accessory' && <span> - Attach: {(item as Accessory).attachmentPoint}</span>}
            {/* Add other item-specific details as needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameItemPanel;