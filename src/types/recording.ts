import { StickmanPose } from '../types/stickman';

export interface RecordedFrame {
  time: number; // Time in milliseconds or frames
  stickmen: {
    id: string;
    pose: StickmanPose;
    health: number;
    // Add other relevant properties to record (e.g., equipped items, status effects)
  }[];
  // Add other relevant game state to record per frame (e.g., projectile positions, event triggers)
}

export interface FightRecording {
  id: string; // Unique ID for the recording
  timestamp: number; // Timestamp of when the fight occurred
  duration: number; // Duration of the fight in milliseconds
  frames: RecordedFrame[]; // Array of recorded frames
  // Add other metadata (e.g., player names, winner, version of the game)
}