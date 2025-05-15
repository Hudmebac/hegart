// src/types/game.ts

    // Define a basic interface for an in-game Item
    export interface GameItem {
        id: string; // Unique identifier
        name: string;
        type: 'weapon' | 'accessory' | 'limb' | 'armor'; // Item type
        description?: string;
        cost: number; // Cost in credits
        // Potentially add properties for inventory management (e.g., quantity)
        // Add optional hitbox property (reusing types from stickman.ts)
        hitbox?: CircleHitbox | RectangleHitbox;
    }

    // Define interface for Weapons
    export interface Weapon extends GameItem {
        type: 'weapon';
        damage: number;
        attackType: 'melee' | 'ranged'; // Type of attack
        // Potentially add properties for attack speed, range, animations, etc.
    }

    // Define interface for Accessories
    export interface Accessory extends GameItem {
        type: 'accessory';
        attachmentPoint: string; // ID of the stickman part where it attaches (e.g., "rightHand", "head")
        // Potentially add properties for visual offset, rotation when attached, etc.
    }

    // Define interface for Armor (for future use)
    export interface Armor extends GameItem {
        type: 'armor';
        defense: number;
        // Potentially add properties for which body parts it covers
    }

    // Define interface for Limbs (for future use in customization)
    export interface LimbItem extends GameItem {
         type: 'limb';
         // Potentially add properties that define the limb's structure or appearance
    }


    // Interface to represent an item equipped by a stickman
    export interface EquippedItem {
        itemId: string; // The ID of the GameItem
        attachedToPartId: string; // The ID of the stickman part it's attached to
        // Potentially add overrides for position/rotation relative to the attachment point
        offsetX?: number;
        offsetY?: number;
        rotationOffset?: number;
    }

    // Re-export hitbox types from stickman.ts if not already done
    // Assuming HitboxShape, CircleHitbox, RectangleHitbox are defined in stickman.ts
    // export type HitboxShape = 'circle' | 'rectangle';
    // export interface CircleHitbox { centerX: number; centerY: number; radius: number; }
    // export interface RectangleHitbox { x: number; y: number; width: number; height: number; rotation: number; }

    // Update Stickman interface (in src/types/stickman.ts) to include equipped items and a base pose
    // You'll need to manually add this to src/types/stickman.ts
    // export interface Stickman {
    //     id: string;
    //     name: string;
    //     initialPosition: { x: number; y: number };
    //     parts: StickmanPart[];
    //     equippedItems: EquippedItem[]; // Added
    // }