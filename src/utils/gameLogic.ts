// src/utils/gameLogic.ts

import { Weapon, GameItem } from '../types/game';
import { StickmanPart } from '../types/stickman';

/**
 * Calculates the damage dealt by an attacking item to a target stickman part.
 * @param attackingItem The weapon used for the attack.
 * @param targetPart The stickman part that was hit.
 * @returns The calculated damage amount.
 */
export const calculateDamage = (attackingItem: Weapon, targetPart: StickmanPart): number => {
    // Basic implementation: return the weapon's base damage.
    // You can add more complex logic here later, such as:
    // - Checking targetPart properties for weak points or armor (when implemented).
    // - Applying critical hit chance.
    // - Considering attack type vs. part type.
    // - Damage modifiers based on animation state or velocity.

    // Example of potential future logic (commented out):
    // let baseDamage = attackingItem.damage;
    // if (targetPart.type === 'head') {
    //     baseDamage *= 1.5; // Headshot bonus
    // }
    // if (targetPart.armor > 0) { // Assuming targetPart has an armor property
    //     baseDamage -= targetPart.armor;
    //     if (baseDamage < 0) baseDamage = 0;
    // }
    // return baseDamage;

    return attackingItem.damage;
};

// You can add other game logic functions here later, such as:
// - Handling stickman health reduction.
// - Managing game states (e.g., playing, paused, game over).
// - AI decision making.