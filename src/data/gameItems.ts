import { Weapon, Accessory } from '../types/game';

export const sampleGameItems: (Weapon | Accessory)[] = [
    {
        id: 'sword_basic',
        name: 'Basic Sword',
        type: 'weapon',
        description: 'A simple sword.',
        cost: 50,
        damage: 10,
        attackType: 'melee',
    },
    {
        id: 'bow_basic',
        name: 'Basic Bow',
        type: 'weapon',
        description: 'A simple bow for ranged attacks.',
        cost: 75,
        damage: 8,
        attackType: 'ranged',
    },
    {
        id: 'shield_basic',
        name: 'Basic Shield',
        type: 'accessory',
        description: 'Provides some defense.',
        cost: 40,
        attachmentPoint: 'leftHand', // Assuming 'leftHand' is a valid part ID
    },
    {
        id: 'helmet_iron',
        name: 'Iron Helmet',
        type: 'accessory',
        description: 'Protects your head.',
        cost: 60,
        attachmentPoint: 'head', // Assuming 'head' is a valid part ID
    },
];