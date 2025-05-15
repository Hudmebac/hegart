
"use client";

import React from 'react';
import StickmanCanvas from '../../components/StickmanCanvas';
import type { Stickman } from '@/types/stickman';
import type { GameItem } from '@/types/game';
import { sampleGameItems } from '@/data/gameItems';

const StickmanGamePage: React.FC = () => {
  // Define props for StickmanCanvas
  // For a real game, these would likely come from state or be more dynamic
  const stickmen: Stickman[] = []; // Start with no stickmen or a default setup
  const gameItems: GameItem[] = sampleGameItems; // Provide the game items

  const handlePartClick = (stickmanId: string, partId: string) => {
    console.log(`StickmanGamePage: Clicked part ${partId} on stickman ${stickmanId}`);
    // Implement game logic for part clicks here
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Stickman Game Arena</h1>
      <div className="border rounded-md shadow-lg overflow-hidden">
        <StickmanCanvas
          stickmen={stickmen}
          width={800} // Example width
          height={600} // Example height
          currentTime={0} // Example current time
          duration={1000} // Example duration
          availableItems={gameItems}
          onStickmanPartClick={handlePartClick}
        />
      </div>
      {/* You can add game controls, scoreboards, etc. here later */}
    </div>
  );
};

export default StickmanGamePage;
