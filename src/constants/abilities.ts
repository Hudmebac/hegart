// src/constants/abilities.ts

import { Ability } from '../types/ability';

export const allAbilities: Ability[] = [
    {
        id: 'powerfulSwing',
        name: 'Powerful Swing',
        description: 'Increases weapon damage for one attack.',
        levelRequired: 2,
        damageMultiplier: 1.5,
    },
    {
        id: 'quickStep',
        name: 'Quick Step',
        description: 'Grants a burst of movement speed.',
        levelRequired: 3,
        speed: 2, // Example of a speed effect
    },
    {
        id: 'heal',
        name: 'Heal',
        description: 'Restores a small amount of health.',
        levelRequired: 5,
        healAmount: 25,
    },
    {
        id: 'stunAttack',
        name: 'Stun Attack',
        description: 'Chance to stun the opponent on hit.',
        levelRequired: 7,
        statusEffect: 'stun', // Example of a status effect
        // You might add a 'chance' property as well
    },
    // Add more abilities here
];