// src/types/stickman.ts

// Define a point in 2D space
export interface Point {
    x: number;
    y: number;
}

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


// Define properties for a limb segment (e.g., upper arm, forearm)
export interface Segment {
    id: string; // Unique identifier for the segment
import { Ability } from "./ability";

    name: string;
    length: number; // Length of the segment
    thickness: number; // Default thickness for drawing
    rotation: number; // Rotation in radians relative to its parent segment or limb connection
    position: Point; // Position relative to its parent joint or segment endpoint (usually {0,0})
    parentEndpoint?: Point; // Not typically needed in the data structure if position is relative
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
}

// Define properties that can be animated (for targeting layers)
export type AnimatableProperty = 'position' | 'rotation'; // Add more as needed

// Define a LayerKeyframe which stores state for a specific layer
// The structure of data within LayerKeyframe will depend on the layer's scope
export interface LayerKeyframe {
    time: number; // Timestamp for the keyframe
    // Data specific to the layer's purpose.
    // If the layer scopes parts, this might contain partial Stickman structures for those parts.
    // If the layer scopes properties, this might contain key-value pairs of property paths and values.
    // This structure will need refinement based on how we represent part/property state.
    [partId: string]: { // Keyed by part ID (body, head, limb segment IDs)
      position?: Point;
      rotation?: number;
      // Add other animatable properties here as needed
    };
}


// Define an Animation Layer
export interface AnimationLayer {
    id: string; // Unique identifier for the layer
    name: string;
    // How this layer affects the overall animation:
    blendMode: 'override' | 'additive' | 'Passthrough' | 'Mask' | 'Alpha';
    opacity: number; // Opacity of the layer (0.0 to 1.0)
    isVisible: boolean; // Whether the layer is visible
    isLocked: boolean; // Whether the layer is locked from editing

    // Define what this layer animates:
    // This version scopes by an array of stickman part IDs.
    scope: {
        partIds: string[]; // Array of stickman part IDs this layer affects (e.g., ["body", "head", "right-arm-segment-1"])
    };

    keyframes: LayerKeyframe[]; // Keyframes specific to this layer
}


// Define an Animation
export interface Animation {
    id: string;
    name: string;
    duration: number;
    // Base keyframes can represent a default animation or pose that layers build upon
    // Alternatively, we could rely solely on layers and a basePose
    keyframes: Keyframe[]; // Consider if base keyframes are still needed or if basePose and layers suffice
    layers: AnimationLayer[]; // Array of animation layers
    basePose: Stickman[]; // A base pose that layers are applied on top of
}

// Keep AnimationState as is for now, it manages the overall animation data
// export interface AnimationState { ... }