// src/components/ShopPanel.tsx
import React from 'react';
import { GameItem } from '../types/game';

interface ShopPanelProps {
    itemsForSale: GameItem[];
    onBuyItem: (itemId: string) => void;
}

const ShopPanel: React.FC<ShopPanelProps> = ({ itemsForSale, onBuyItem }) => {
    return (
        <div style={{ border: '1px solid black', padding: '10px', margin: '10px', width: '300px' }}>
            <h2>Shop</h2>
            <ul>
                {itemsForSale.map(item => (
                    <li key={item.id} style={{ marginBottom: '10px', borderBottom: '1px dashed #ccc', paddingBottom: '5px' }}>
                        <div><strong>{item.name}</strong> ({item.type})</div>
                        <div>Cost: {item.cost} Credits</div>
                        <button onClick={() => onBuyItem(item.id)}>Buy</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ShopPanel;