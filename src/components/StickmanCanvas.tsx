import React, { useRef, useEffect, useMemo } from 'react';
import { Stickman, Part } from '../types/stickman';
import { GameItem, EquippedItem, Weapon, Accessory } from '../types/game';
import { attackAnimations } from '../animation/attackAnimations'; // Import attack animations

interface StickmanCanvasProps {
  stickmen: Stickman[];
  width: number;
  height: number;
  currentTime: number;
  duration: number;
  availableItems: GameItem[]; // Add available items prop
  onStickmanPartClick: (stickmanId: string, partId: string) => void; // New prop
}

// Helper function to blend two partial poses (for blending attack animations)

const StickmanCanvas: React.FC<StickmanCanvasProps> = ({
  stickmen,
  width,
  height,
  currentTime,
  duration,
  availableItems,
  onStickmanPartClick,
}) => {

  // Create a map for quick item lookup
  const itemMap = useMemo(() => {
    return availableItems.reduce((map, item) => ({ ...map, [item.id]: item }), {});
  }, [availableItems]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

    const blendPoses = (basePoseParts: Part[], overlayPoseData: { [partId: string]: any }): Part[] => {
        // Create a deep copy of the base pose parts
        const blendedParts: Part[] = JSON.parse(JSON.stringify(basePoseParts));

        // Iterate through the overlay pose data
        for (const partId in overlayPoseData) {
            const overlayPartData = overlayPoseData[partId];
            const partToBlend = blendedParts.find(p => p.id === partId);

            if (partToBlend && overlayPartData) {
                // Simple override for now - can implement actual blending later
                Object.assign(partToBlend, overlayPartData);
            }
        }
        return blendedParts;
    };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Function to draw an equipped item
    const drawEquippedItem = (ctx: CanvasRenderingContext2D, equippedItem: EquippedItem, attachedPart: Part) => {
        const item = itemMap[equippedItem.itemId];
        if (!item) return; // Item not found

        ctx.save();
        // Translate and rotate to the part's local origin
        ctx.translate(attachedPart.position.x, attachedPart.position.y);
        ctx.rotate(attachedPart.rotation);

        // Apply item-specific offsets and rotations if any
        ctx.translate(equippedItem.offsetX || 0, equippedItem.offsetY || 0);
        ctx.rotate(equippedItem.rotationOffset || 0);

        // Draw the item based on its type or visual properties
        ctx.fillStyle = 'gray'; // Default color for items

        if (item.type === 'weapon') {
             const weapon = item as Weapon;
             // Basic visual representation: a rectangle
             const weaponWidth = 50; // Example size
             const weaponHeight = 10; // Example size
             ctx.fillRect(-weaponWidth / 2, -weaponHeight / 2, weaponWidth, weaponHeight);

             // Simple handle
             ctx.fillStyle = 'brown';
             ctx.fillRect(-weaponWidth / 2, -weaponHeight / 2 - 5, 10, 20);

        } else if (item.type === 'accessory') {
             const accessory = item as Accessory;
             // Basic visual representation: a circle
             const accessoryRadius = 8; // Example size
             ctx.beginPath();
             ctx.arc(0, 0, accessoryRadius, 0, Math.PI * 2);
             ctx.fill();
        }
        // Add drawing logic for other item types (armor, etc.) here

        // Optional: Draw attachment point visual aid
        // ctx.fillStyle = 'red';
        // ctx.beginPath();
        // ctx.arc(0, 0, 3, 0, Math.PI * 2);
        // ctx.fill();


        ctx.restore();
    };

     // Function to get the interpolated pose data for an attack animation
    const getInterpolatedAttackPose = (stickman: Stickman, time: number): { [partId: string]: any } => {
        if (!stickman.currentAttackAnimation) return {}; // No attack animation playing

        const animationData = attackAnimations[stickman.currentAttackAnimation];
        if (!animationData || animationData.length === 0) return {}; // Animation data not found

        // You will need to track the *playback time* of the attack animation for each stickman
        // For simplicity here, we'll use a placeholder and assume the animation loops or plays once
        // A proper system needs to manage the animation's elapsed time and duration.
        // Let's assume the animation time loops based on the main currentTime for this example,
        // but this should be managed per-stickman in a real implementation.
         const attackAnimationTime = time % animationData[animationData.length - 1].time; // Simple loop placeholder

         // Find the relevant keyframes in the attack animation data
        const sortedKeyframes = [...animationData].sort((a, b) => a.time - b.time);
        let kfBefore = sortedKeyframes[0];
        let kfAfter = sortedKeyframes[sortedKeyframes.length - 1];

         for (let i = 0; i < sortedKeyframes.length - 1; i++) {
            if (attackAnimationTime >= sortedKeyframes[i].time && attackAnimationTime <= sortedKeyframes[i + 1].time) {
                kfBefore = sortedKeyframes[i];
                kfAfter = sortedKeyframes[i + 1];
                break;
            }
         }

         if (kfBefore.time === kfAfter.time) return kfBefore.pose; // At a keyframe

        const timeRange = kfAfter.time - kfBefore.time;
        const timeElapsed = attackAnimationTime - kfBefore.time;
        const t = timeElapsed / timeRange;

        // Simple interpolation for parts present in both keyframes (needs refinement)
        const interpolatedPose: { [partId: string]: any } = {};
        // You would interpolate properties (position, rotation) for each part defined in the keyframes here.
        // For this diff, we'll keep it conceptual as interpolation logic exists elsewhere.
        // This part needs to be implemented using interpolation from utils/animation.ts
         console.warn("Attack animation interpolation is conceptual and needs implementation.");
         // Placeholder: return the pose from the closest keyframe or a blend
         return kfBefore.pose; // Simple placeholder
    };

    // Function to draw a stickman (similar to previous implementation)
    const drawStickman = (ctx: CanvasRenderingContext2D, stickman: Stickman) => {
      ctx.save();
      // Apply global stickman transformations if any
      ctx.translate(stickman.position.x, stickman.position.y);
      ctx.rotate(stickman.rotation);

       let partsToDraw = stickman.parts;

        // If an attack animation is playing, blend its pose with the base pose
        if (stickman.currentAttackAnimation) {
            // Get the interpolated pose data from the attack animation at the current time
            const interpolatedAttackPoseData = getInterpolatedAttackPose(stickman, currentTime); // Use currentTime for placeholder

            // Blend the stickman's base pose with the attack animation pose
            partsToDraw = blendPoses(stickman.parts, interpolatedAttackPoseData);
        }

      stickman.parts.forEach(part => {
        ctx.save();
        // Apply part-specific transformations
        ctx.translate(part.position.x, part.position.y);
        ctx.rotate(part.rotation);

        // Draw the part (e.g., a rectangle or circle)
        ctx.fillStyle = part.color || 'black'; // Assuming parts have color
        if (part.type === 'segment') { // Assuming parts have a type
            const segment = part as Part; // Cast to specific part type if needed
            ctx.fillRect(-segment.length / 2, -segment.thickness / 2, segment.length, segment.thickness);
        } else if (part.type === 'joint') {
             const joint = part as Part; // Cast
             ctx.beginPath();
             ctx.arc(0, 0, joint.radius || 5, 0, Math.PI * 2);
             ctx.fill();
        } else if (part.type === 'head') {
             const head = part as Part; // Cast
             ctx.beginPath();
             ctx.arc(0, 0, head.radius || 10, 0, Math.PI * 2);
             ctx.fill();
        }
         // Add more part types (Body) as needed

        ctx.restore();

        // Draw equipped items attached to this part
         const equippedItemsOnPart = stickman.equippedItems.filter(eqItem => eqItem.attachedToPartId === part.id);
         equippedItemsOnPart.forEach(eqItem => {
            drawEquippedItem(ctx, eqItem, part);
         });

      });

      ctx.restore();
    };


    stickmen.forEach(stickman => {
        drawStickman(context, stickman);
    });

  }, [stickmen, width, height, currentTime]); // Redraw when stickmen data or time changes

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Iterate through stickmen and their parts to check for clicks
    for (const stickman of stickmen) {
      // We need a way to get the transformed coordinates and bounding boxes of each part
      // This requires re-applying transformations and calculating bounds for hit testing.
      // This is a simplified approach checking against simplified bounds.
      // A more accurate approach would involve inverse transformations.

      // Simplified hit testing: Iterate through parts and check bounds.
      // This needs to be more robust to account for rotations and translations.

       for (const part of stickman.parts) {
           // This hit testing is highly simplified and needs significant improvement

          // This is a very basic bounding box check and WILL NOT work correctly
          // with rotated parts. A proper implementation needs to transform
          // the mouse coordinates into the part's local space for accurate hit testing.

           const partBounds = {
                x: stickman.position.x + part.position.x, // Simplified, ignores rotations
                y: stickman.position.y + part.position.y, // Simplified, ignores rotations
                width: 20, // Placeholder, needs to be calculated from part size
                height: 20, // Placeholder, needs to be calculated from part size
           };

           // Check if mouse is within simplified bounds
           if (mouseX > partBounds.x - partBounds.width / 2 &&
              mouseX < partBounds.x + partBounds.width / 2 &&
              mouseY > partBounds.y - partBounds.height / 2 &&
              mouseY < partBounds.y + partBounds.height / 2) {
              // Simple hit detected (will be inaccurate)
              onStickmanPartClick(stickman.id, part.id);
              return; // Stop checking after finding a hit
           }
       }
    }
  };


  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick} // Add the onClick handler
    />
  );
};

export default StickmanCanvas;