// src/constants/gameConstants.ts

export const CREDITS_PER_DEFEAT: number = 50;

export const EXP_PER_DEFEAT: number = 100;

// Define experience required for each level (index 0 is unused, level 1 requires 0 exp, level 2 requires 100, etc.)
export const LEVEL_UP_EXP_REQUIREMENTS: number[] = [
    0,   // Level 1 requires 0 exp
    100, // Level 2 requires 100 total exp
    250, // Level 3 requires 250 total exp
    500, // Level 4 requires 500 total exp
    // Add more levels as needed
];

export const STRENGTH_PER_LEVEL: number = 1;
export const DEFENSE_PER_LEVEL: number = 1;
export const SPEED_PER_LEVEL: number = 0.1;