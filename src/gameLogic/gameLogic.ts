import { Stickman, StickmanPose, StickmanPart, EquippedItem, EquippedItemEffect } from '../types/stickman';
import { GameItem } from '../types/game';
import { v4 as uuidv4 } from 'uuid';
import { getDistance } from '../utils/math'; // Assuming getDistance is needed here

// Define a base damage value for attacks
const BASE_ATTACK_DAMAGE = 10; // Example base damage

/**
 * Calculates the damage dealt from an attacker to a defender.
 * Takes into account attacker's strength and defender's defense.
 * @param attacker The attacking stickman.
 * @param defender The defending stickman.
 * @param baseDamage The base damage value of the attack (e.g., from a weapon).
 * @returns The calculated damage amount.
 */
export const calculateDamage = (attacker: Stickman, defender: Stickman, baseDamage: number = BASE_ATTACK_DAMAGE): number => {
    // Simple damage calculation: base damage modified by relative strength/defense
    // Ensure defense is not zero to avoid division by zero errors
    const defenseFactor = defender.defense > 0 ? defender.defense : 1;
    let damage = baseDamage * (attacker.strength / defenseFactor);

    // You can add more complex calculations here later,
    // like critical hits, damage types, resistances, etc.

    // Ensure damage is not negative
    return Math.max(0, damage);
};

/**
 * Applies an equipped item's effects to a stickman's stats.
 * @param stickman The stickman whose stats are being affected.
 * @param item The equipped item.
 * @returns The stickman with updated stats.
 */
export const applyEquippedItemEffects = (stickman: Stickman): Stickman => {
    let updatedStickman = { ...stickman };

    // Reset stats to base values before applying item effects
    // You might need to store base stats separately if they can also be leveled up
    updatedStickman.strength = 1 + (stickman.level - 1) * 1; // Example: base + level bonus
    updatedStickman.defense = 1 + (stickman.level - 1) * 1; // Example: base + level bonus
    updatedStickman.speed = 1 + (stickman.level - 1) * 0.1; // Example: base + level bonus

    stickman.equippedItems.forEach(equippedItem => {
        // Find the actual GameItem data
        // This assumes you have access to your full item list here
        // A better approach might be to store item effects directly in EquippedItem
        // For now, this is a placeholder
        // const itemData = getItemDataById(equippedItem.itemId); // You'll need this function

        // Assuming EquippedItem directly contains effect data for simplicity for now
        if (equippedItem.effects) {
            equippedItem.effects.forEach(effect => {
                switch (effect.type) {
                    case 'strength':
                        updatedStickman.strength += effect.value;
                        break;
                    case 'defense':
                        updatedStickman.defense += effect.value;
                        break;
                    case 'speed':
                        updatedStickman.speed += effect.value;
                        break;
                    // Add other effect types here
                }
            });
        }
    });

    return updatedStickman;
};


/**
 * Checks for collisions between stickman parts and items (like weapons).
 * This is a simplified example. You would need more robust collision detection.
 * @param stickman1 The first stickman.
 * @param stickman2 The second stickman.
 * @returns An array of potential collision details (you'd refine this).
 */
export const checkCollisions = (stickman1: Stickman, stickman2: Stickman) => {
    const collisions: { attackerId: string, defenderId: string, damage: number }[] = [];

    // Example: Check for collisions between stickman1's equipped items and stickman2's parts
    stickman1.equippedItems.forEach(equippedItem => {
        // Assuming item position is tied to the part it's equipped on
        const equippedPart = stickman1.parts.find(part => part.id === equippedItem.equippedToPartId);

        if (equippedPart && equippedItem.isAttacking) { // You'd set isAttacking during attack animations
            // Simple distance check as a placeholder for collision
            stickman2.parts.forEach(defenderPart => {
                const distance = getDistance(equippedPart.position, defenderPart.position);
                const collisionThreshold = 20; // Example threshold

                if (distance < collisionThreshold) {
                    // Potential hit - calculate damage
                    const baseItemDamage = equippedItem.effects.find(effect => effect.type === 'damage')?.value || 0;
                    const damageDealt = calculateDamage(stickman1, stickman2, baseItemDamage);
                     console.log(`Collision detected! ${stickman1.id} hits ${stickman2.id} for ${damageDealt} damage.`);
                    collisions.push({ attackerId: stickman1.id, defenderId: stickman2.id, damage: damageDealt });

                    // In a real game, you'd likely need more complex collision detection
                    // and ensure damage is only applied once per attack animation.
                }
            });
        }
    });

    // You would also check collisions the other way (stickman2 attacking stickman1)
    // and potentially collisions between parts directly if needed (e.g., punching).

    return collisions;
};


// Helper function to interpolate between keyframes
export const interpolatePose = (keyframes: any[], time: number): StickmanPose => {
    // Ensure keyframes are sorted by time
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

    // Find the two keyframes to interpolate between
    let kf1 = sortedKeyframes[0];
    let kf2 = sortedKeyframes[0];
    for (let i = 0; i < sortedKeyframes.length; i++) {
        if (sortedKeyframes[i].time <= time) {
            kf1 = sortedKeyframes[i];
        }
        if (sortedKeyframes[i].time >= time && sortedKeyframes[i].time > kf1.time) {
            kf2 = sortedKeyframes[i];
            break;
        }
        if (i === sortedKeyframes.length - 1) {
             kf2 = sortedKeyframes[sortedKeyframes.length - 1]; // Stay at the last keyframe
        }
    }


     // If time is beyond the last keyframe, just return the last pose
    if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
        return sortedKeyframes[sortedKeyframes.length - 1].pose as StickmanPose;
    }


    // If only one keyframe or time is exactly at a keyframe
    if (kf1 === kf2 || kf1.time === kf2.time) {
        return kf1.pose as StickmanPose;
    }

    // Calculate the interpolation factor (0 to 1)
    const factor = (time - kf1.time) / (kf2.time - kf1.time);

    // Interpolate position and rotation for each part
    const interpolatedPose: Partial<StickmanPose> = {};

    // Get all part keys from both keyframes
    const partKeys = new Set([...Object.keys(kf1.pose), ...Object.keys(kf2.pose)]);

    partKeys.forEach(partId => {
        const p1 = (kf1.pose as any)[partId];
        const p2 = (kf2.pose as any)[partId];

        if (p1 && p2) {
            // Interpolate position
            const x = p1.position.x + (p2.position.x - p1.position.x) * factor;
            const y = p1.position.y + (p2.position.y - p1.position.y) * factor;

            // Interpolate rotation (simple linear interpolation)
            const rotation = p1.rotation + (p2.rotation - p1.rotation) * factor;

            (interpolatedPose as any)[partId] = {
                position: { x, y },
                rotation: rotation,
            };
        } else if (p1) {
            // If part only exists in kf1, use kf1's pose
             (interpolatedPose as any)[partId] = { ...p1 };
        } else if (p2) {
            // If part only exists in kf2, use kf2's pose
            // This case should ideally not happen if keyframes are structured correctly
             (interpolatedPose as any)[partId] = { ...p2 };
        }
    });

     return interpolatedPose as StickmanPose; // Cast back to StickmanPose
};


/**
 * Blends a base pose with an overlay pose (e.g., an attack animation).
 * The overlay pose overrides the base pose for the parts it defines.
 * @param basePose The base stickman pose.
 * @param overlayPose The pose to overlay (e.g., interpolated animation frame).
 * @returns The blended stickman pose.
 */
export const blendPoses = (basePose: StickmanPose, overlayPose: Partial<StickmanPose>): StickmanPose => {
    const blendedPose: StickmanPose = { ...basePose };

    // Override base pose data with overlay pose data for defined parts
    Object.keys(overlayPose).forEach(partId => {
        if ((overlayPose as any)[partId]) {
             (blendedPose as any)[partId] = (overlayPose as any)[partId];
        }
    });

    return blendedPose;
};