import { StickmanPose } from '../types/stickman';

// Define the structure for an attack animation keyframe
interface AttackKeyframe {
  time: number; // Time in milliseconds relative to the start of the animation
  pose: Partial<StickmanPose>; // Partial pose data for parts involved in the attack
}

// Define the structure for an attack animation sequence
interface AttackAnimation {
  duration: number; // Total duration of the animation in milliseconds
  keyframes: AttackKeyframe[];
  // Potentially add properties for looping, easing, etc.
}

// Define the object to hold different attack animations
interface AttackAnimations {
  [animationName: string]: AttackAnimation;
}

// Define sample attack animations
export const attackAnimations: AttackAnimations = {
  basicAttack: {
    duration: 500, // 500ms animation
    keyframes: [
      {
        time: 0,
        pose: {
          // Starting pose (e.g., arm in neutral position)
          rightArm: { rotation: 0 },
          rightForearm: { rotation: 0 },
        },
      },
      {
        time: 250,
        pose: {
          // Mid-swing pose (e.g., arm extended forward)
          rightArm: { rotation: 45 },
          rightForearm: { rotation: -30 },
        },
      },
      {
        time: 500,
        pose: {
          // End pose (e.g., arm returned to neutral or follow-through)
          rightArm: { rotation: 0 },
          rightForearm: { rotation: 0 },
        },
      },
    ],
  },
  // Add other attack animations here
  // heavyAttack: { ... }
  // rangedAttack: { ... }
};