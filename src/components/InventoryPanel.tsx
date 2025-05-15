import React from 'react';
import { GameItem, EquippedItem } from '../types/game';

interface InventoryPanelProps {
    playerInventory: GameItem[];
    equippedItems: EquippedItem[]; // Pass the list of all equipped items to check if an inventory item is equipped
    // Callback for equipping an item from the inventory.
    // You'll need to handle selecting the target stickman/part in App.tsx
    onEquipItemFromInventory: (itemId: string) => void;
    // Callback for unequipping an item.
    // You'll need to identify which EquippedItem to remove in App.tsx
    onUnequipItem: (itemId: string) => void;
    // You might need to pass the currently selected stickman ID for equipping/unequipping
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ playerInventory, equippedItems, onEquipItemFromInventory, onUnequipItem }) => {
    // Helper function to check if an item from the inventory is currently equipped
    const isItemEquipped = (itemId: string): boolean => {
        return equippedItems.some(equipped => equipped.itemId === itemId);
    };

    return (
        <div style={{ border: '1px solid black', padding: '10px', margin: '10px' }}>
            <h2>Inventory</h2>
            {playerInventory.length === 0 ? (
                <p>Your inventory is empty.</p>
            ) : (
                <ul>
                    {playerInventory.map(item => (
                        <li key={item.id}>
                            {item.name} ({item.type}){isItemEquipped(item.id) ? ' (Equipped)' : ''}
                            {!isItemEquipped(item.id) && (
                                <button onClick={() => onEquipItemFromInventory(item.id)}>Equip</button>
                            )}
                            {/*
 Unequip button is visible if the item is currently equipped.
                                When clicked, it calls the onUnequipItem prop with the item's ID.
                             */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default InventoryPanel;