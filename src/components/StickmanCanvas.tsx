
"use client";

import React, { useRef, useEffect, useMemo } from 'react';
import { Stickman, Body, Head, Limb, Segment, Point as StickmanPoint } from '../types/stickman'; // Renamed Point to StickmanPoint to avoid conflict if any
import { GameItem, EquippedItem, Weapon, Accessory } from '../types/game';
// import { attackAnimations } from '../animation/attackAnimations'; // Commented out for now, requires StickmanPose definition

interface StickmanCanvasProps {
  stickmen: Stickman[];
  width: number;
  height: number;
  currentTime: number;
  duration: number;
  availableItems: GameItem[];
  onStickmanPartClick: (stickmanId: string, partId: string) => void;
}

const StickmanCanvas: React.FC<StickmanCanvasProps> = ({
  stickmen,
  width,
  height,
  currentTime,
  duration,
  availableItems,
  onStickmanPartClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const itemMap = useMemo(() => {
    if (!availableItems) return {}; // Add a guard for undefined availableItems
    return availableItems.reduce((map, item) => ({ ...map, [item.id]: item }), {} as Record<string, GameItem>);
  }, [availableItems]);

  // Helper: Rotate a point around an origin
  const rotatePoint = (point: StickmanPoint, origin: StickmanPoint, angle: number): StickmanPoint => {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const px = point.x - origin.x;
    const py = point.y - origin.y;
    const xnew = px * c - py * s;
    const ynew = px * s + py * c;
    return { x: xnew + origin.x, y: ynew + origin.y };
  };

  // Helper to draw an equipped item (simplified)
  const drawEquippedItem = (ctx: CanvasRenderingContext2D, item: GameItem, partAbsPos: StickmanPoint, partAbsRot: number) => {
    ctx.save();
    ctx.translate(partAbsPos.x, partAbsPos.y);
    ctx.rotate(partAbsRot);
    // Item-specific drawing logic (simplified placeholder)
    ctx.fillStyle = 'grey';
    if (item.type === 'weapon') {
      ctx.fillRect(0, -5, 30, 10); // Placeholder weapon shape
    } else if (item.type === 'accessory') {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2); // Placeholder accessory shape
      ctx.fill();
    }
    ctx.restore();
  };


  // Refactored drawStickman function
  const drawStickmanFigure = (ctx: CanvasRenderingContext2D, stickman: Stickman) => {
    ctx.save(); // Save the initial context state

    // --- Global Transformation based on Body ---
    ctx.translate(stickman.body.position.x, stickman.body.position.y);
    ctx.rotate(stickman.body.rotation);

    // --- Draw Body ---
    // Body's local origin is (0,0) after the global transform. Draw relative to that.
    ctx.strokeStyle = stickman.body.strokeStyle || 'black';
    ctx.lineWidth = stickman.body.lineWidth || stickman.body.thickness;
    ctx.strokeRect(-stickman.body.width / 2, -stickman.body.height / 2, stickman.body.width, stickman.body.height);
    
    // Draw items attached to body
    (stickman.equippedItems || [])
        .filter(ei => ei.attachedToPartId === stickman.body.id)
        .forEach(ei => {
            const itemData = itemMap[ei.itemId];
            if (itemData) {
                // For body, item position would be relative to body center (0,0 in current ctx)
                // This needs proper offset/attachment logic from EquippedItem
                drawEquippedItem(ctx, itemData, {x: 0, y: 0}, 0); // Placeholder attachment
            }
        });


    // --- Draw Head ---
    // Head is positioned relative to its connection point on the body.
    // Body's connection points are relative to body's center (0,0 in current local coords).
    const headConnectionLocal = stickman.body.connectionPoints.head; // This is {x, y} relative to body center

    ctx.save(); // Save context for head transformation
    ctx.translate(headConnectionLocal.x, headConnectionLocal.y); // Move to where head connects on body
    ctx.rotate(stickman.head.rotation); // Apply head's rotation relative to body
    // Head's own `position` is relative to its connection point *after* parent (body) rotation and head's own rotation
    ctx.translate(stickman.head.position.x, stickman.head.position.y);


    ctx.strokeStyle = stickman.head.strokeStyle || 'black';
    ctx.lineWidth = stickman.head.lineWidth || stickman.head.thickness;
    ctx.beginPath();
    ctx.arc(0, 0, stickman.head.radius, 0, Math.PI * 2); // Draw head at its local origin
    ctx.stroke();

    (stickman.equippedItems || [])
        .filter(ei => ei.attachedToPartId === stickman.head.id)
        .forEach(ei => {
            const itemData = itemMap[ei.itemId];
            if (itemData) {
                 drawEquippedItem(ctx, itemData, {x:0, y:0}, 0); // Placeholder attachment
            }
        });
    ctx.restore(); // Restore from head transformation


    // --- Draw Limbs ---
    stickman.limbs.forEach(limb => {
      ctx.save(); // Save context for this limb chain

      // Limb connection point is relative to body's center (0,0 in current local coords)
      const limbConnectionLocal = stickman.body.connectionPoints[limb.id] || limb.connectionPoint;
      ctx.translate(limbConnectionLocal.x, limbConnectionLocal.y);
      
      // Keep track of the current rotation context for segments
      // Limb itself doesn't have a rotation property in the type, segments rotate relative to connection/previous segment

      limb.segments.forEach(segment => {
        ctx.save(); // Save context for this segment

        // Segment rotation is relative to its connection point (start of the segment)
        ctx.rotate(segment.rotation);
        // Segment's own `position` is typically {x:0, y:0} as it's drawn from its start

        ctx.strokeStyle = segment.strokeStyle || 'black';
        ctx.lineWidth = segment.lineWidth || segment.thickness;
        ctx.beginPath();
        ctx.moveTo(0, 0); // Start of segment
        ctx.lineTo(segment.length, 0); // Draw along its local x-axis
        ctx.stroke();

        (stickman.equippedItems || [])
            .filter(ei => ei.attachedToPartId === segment.id)
            .forEach(ei => {
                const itemData = itemMap[ei.itemId];
                if (itemData) {
                    // Item attached to a segment, could be at its start, middle, or end
                    // Placeholder: draw at mid-point of segment
                    drawEquippedItem(ctx, itemData, {x: segment.length / 2, y:0}, 0); 
                }
            });

        // Translate to the end of this segment for the next one in the chain
        ctx.translate(segment.length, 0);
        
        ctx.restore(); // Restore from this segment's transformation
      });

      ctx.restore(); // Restore from this limb chain's transformation
    });

    ctx.restore(); // Restore initial context state (before this stickman)
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, width, height);

    stickmen.forEach(stickman => {
        // TODO: Integrate attack animation blending here if needed.
        // For now, just draw the base stickman figure.
        drawStickmanFigure(context, stickman);
    });

  }, [stickmen, width, height, currentTime, itemMap, availableItems]); // Added availableItems to dependency array due to itemMap

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Simplified click handler for now.
    // Accurate hit detection requires transforming mouse coordinates into each part's local space.
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Basic placeholder for clicking the first stickman's body
    if (stickmen.length > 0) {
        const firstStickman = stickmen[0];
        // This is a very rough check and doesn't account for rotation or actual shape
        const body = firstStickman.body;
        const bodyWorldX = body.position.x - body.width / 2;
        const bodyWorldY = body.position.y - body.height / 2;

        if (mouseX >= bodyWorldX && mouseX <= bodyWorldX + body.width &&
            mouseY >= bodyWorldY && mouseY <= bodyWorldY + body.height) {
            onStickmanPartClick(firstStickman.id, body.id);
            return;
        }
    }
    console.log(`Canvas clicked at (${mouseX}, ${mouseY}). Hit detection TBD.`);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      style={{ border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}
    />
  );
};

export default StickmanCanvas;
