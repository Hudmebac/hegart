
// src/types/stickman.ts

// Define a point in 2D space
export interface Point {
    x: number;
    y: number;
}

// Define BlendMode type
export type BlendMode = 'override' | 'additive' | 'Passthrough' | 'Mask' | 'Alpha';

// Define properties for a limb (e.g., arm, leg)
export interface Limb {
    id: string; // Unique identifier for the limb
    type: 'arm' | 'leg'; // Type of limb
    name: string;
    connectionPoint: Point; // Point on the parent part where this limb connects (relative position)
    segments: Segment[]; // Array of segments that make up the limb
}

// Define properties for the main body part
export interface Body {
    id: string; // Unique identifier for the body
    name: string;
    position: Point; // Position of the body's center in world coordinates
    rotation: number; // Rotation of the body in radians
    width: number;
    height: number;
    thickness: number; // Default thickness for drawing
    connectionPoints: { // Points on the body where limbs connect
        [key: string]: Point; // Relative position to the body's center
    };
    minPosition?: Point; // Optional: Minimum position limit (x, y)
    maxPosition?: Point; // Optional: Maximum position limit (x, y)
    minRotation?: number; // Optional: Minimum rotation limit in radians
    maxRotation?: number; // Optional: Maximum rotation limit in radians
    strokeStyle?: string; // Optional: Custom stroke color
    lineWidth?: number; // Optional: Custom line width
}

// Define properties for the head part
export interface Head {
    id: string; // Unique identifier for the head
    name: string;
    position: Point; // Position relative to its connection point on the body
    rotation: number; // Rotation relative to its parent (body or neck segment)
    radius: number;
    thickness: number; // Default thickness for drawing
    minPosition?: Point; // Optional: Minimum position limit (x, y) relative to parent
    maxPosition?: Point; // Optional: Maximum position limit (x, y) relative to parent
    minRotation?: number; // Optional: Minimum rotation limit in radians relative to parent
    maxRotation?: number; // Optional: Maximum rotation limit in radians relative to parent
    strokeStyle?: string; // Optional: Custom stroke color
    lineWidth?: number; // Optional: Custom line width
}

export interface Segment {
    id: string; // Unique identifier for the segment
    name: string;
    length: number; // Length of the segment
    thickness: number; // Default thickness for drawing
    rotation: number; // Rotation in radians relative to its parent segment or limb connection
    position: Point; // Position relative to its parent joint or segment endpoint (usually the joint)
    minRotation?: number; // Optional: Minimum rotation limit in radians
    maxRotation?: number; // Optional: Maximum rotation limit in radians
    strokeStyle?: string; // Optional: Custom stroke color
    lineWidth?: number; // Optional: Custom line width
}

// Import Ability if it's used here and defined elsewhere
// import { Ability } from "./ability";
// For now, let's assume Ability type is simple or defined inline if not complex
export interface Ability {
    id: string;
    name: string;
    // Add other ability properties as needed
}

// Define the complete Stickman structure
export interface Stickman {
    id: string; // Unique identifier for the stickman
    name: string;
    strength: number; // Combat stat: Strength
    defense: number; // Combat stat: Defense
    speed: number; // Combat stat: Speed
    body: Body;
    health: number; // Current health
    maxHealth: number; // Maximum health
    head: Head;
    experience: number; // Experience points
    level: number; // Stickman level
    isAI: boolean; // Is this stickman controlled by AI?
    aiState: 'idle' | 'attacking' | 'defending'; // Current state of the AI
    targetId: string | null; // The ID of the stickman this AI is targeting (null if no target)
    currentAttackAnimation: string | null; // The ID of the current attack animation being played (null if none)
    limbs: Limb[];
    unlockedAbilities: Ability[]; // Abilities the stickman has unlocked
    equippedItems?: EquippedItem[]; // Make optional or initialize as empty array
}

// Define properties that can be animated (for targeting layers)
export type AnimatableProperty = 'position' | 'rotation'; // Add more as needed

// Define a LayerKeyframe which stores state for a specific layer
export interface LayerKeyframe {
    time: number; // Timestamp for the keyframe
    // Data specific to the layer's purpose, keyed by stickman ID, then part ID.
    [stickmanId: string]: { // e.g., 'stickman-1'
        body?: Partial<Body>;
        head?: Partial<Head>;
        limbs?: {
            [limbId: string]: { // e.g., 'right-arm'
                segments?: {
                    [segmentId: string]: Partial<Segment>; // e.g., 'right-forearm'
                };
                // Potentially other limb-level animatable properties if needed
            };
        };
    } | number; // Allow 'time' property
}


// Define an Animation Layer
export interface AnimationLayer {
    id: string; // Unique identifier for the layer
    name: string;
    blendMode: BlendMode; // Use the defined BlendMode type
    opacity: number; // Opacity of the layer (0.0 to 1.0)
    isVisible: boolean; // Whether the layer is visible
    isLocked: boolean; // Whether the layer is locked from editing
    scope: {
        partIds: string[]; // Array of stickman part IDs this layer affects (e.g., "stickman-1.body", "stickman-1.head", "stickman-1.limbs.right-arm.segments.right-forearm")
        properties?: AnimatableProperty[]; // Optional: specific properties this layer animates on the scoped parts
    };
    keyframes: LayerKeyframe[]; // Keyframes specific to this layer
}

// Base keyframe for the main animation timeline (if still used)
export interface Keyframe {
    time: number;
    stickmen: Stickman[]; // Full stickman pose at this time
}

// Define an Animation
export interface Animation {
    id: string;
    name: string;
    duration: number;
    keyframes: Keyframe[]; 
    layers: AnimationLayer[]; 
    basePose: Stickman[]; 
}

// AnimationState to manage overall animation playback and data
export interface AnimationState {
    animations: Animation[];
    currentAnimationId: string | null;
    currentTime: number;
    isPlaying: boolean;
    currentLayerId: string | null; // ID of the currently selected layer for editing
}

// Types related to Fight Recording and Equipped Items (if they are part of stickman.ts)
// It's common to keep game-specific item types separate (e.g., in types/game.ts)
// but if they are deeply intertwined with stickman structure for animation, they might be here.

export interface EquippedItem {
    itemId: string;
    attachedToPartId: string; // e.g., 'body-1', 'head-1', 'right-forearm'
    // Optional: effects or properties specific to how it's equipped
    effects?: any[]; // Define specific effect types later
}

export interface FightRecordingFrame { // Renamed from RecordedFrame if that's for drawing paths
    time: number;
    stickmen: {
        id: string;
        pose: any; // Simplified for now, should be a serializable representation of Stickman parts
        health: number;
    }[];
}

export interface FightRecording {
    id: string;
    timestamp: number;
    duration: number;
    frames: FightRecordingFrame[];
}

// If Weapon is a specific type of EquippedItem with its own properties
export interface Weapon extends EquippedItem {
    damage: number;
    attackType: 'melee' | 'ranged';
}
