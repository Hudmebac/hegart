// src/utils/drawing.ts

import { Stickman, Point, Limb, Segment, Body, Head } from '@/types/stickman';
import { SelectedPart } from '@/components/canvas/StickmanCanvas'; // Assuming SelectedPart is defined here or imported

// Define highlight colors (should match the ones in StickmanCanvas.tsx)
const SELECTION_COLOR = 'blue';
const LIMIT_COLOR = 'red';

/**
 * Rotates a point around an origin.
 * @param point The point to rotate.
 * @param origin The origin of rotation.
 * @param angle The rotation angle in radians.
 * @returns The rotated point.
 */
export const rotatePoint = (point: Point, origin: Point, angle: number): Point => {
    const translatedX = point.x - origin.x;
    const translatedY = point.y - origin.y;

    const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
    const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

    return {
        x: rotatedX + origin.x,
        y: rotatedY + origin.y,
    };
};

/**
 * Calculates the absolute position of a point relative to a parent's position and rotation.
 * @param parentPosition The absolute position of the parent.
 * @param parentRotation The absolute rotation of the parent.
 * @param relativePosition The position relative to the parent's origin.
 * @returns The absolute position of the point.
 */
export const getAbsolutePosition = (parentPosition: Point, parentRotation: number, relativePosition: Point): Point => {
    // Rotate the relative position by the parent's rotation around the parent's origin
    const rotatedRelativePosition = rotatePoint(relativePosition, { x: 0, y: 0 }, parentRotation);

    // Add the rotated relative position to the parent's absolute position
    return {
        x: parentPosition.x + rotatedRelativePosition.x,
        y: parentPosition.y + rotatedRelativePosition.y,
    };
};

/**
 * Calculates the absolute endpoint of a segment given its start, length, and absolute rotation.
 * @param startPointAbsolute The absolute start point of the segment.
 * @param length The length of the segment.
 * @param absoluteRotation The absolute rotation of the segment in radians.
 * @returns The absolute endpoint of the segment.
 */
export const getSegmentEndpoint = (startPointAbsolute: Point, length: number, absoluteRotation: number): Point => {
    return {
        x: startPointAbsolute.x + length * Math.cos(absoluteRotation),
        y: startPointAbsolute.y + length * Math.sin(absoluteRotation),
    };
};

/**
 * Transforms a point from world coordinates to a local coordinate system.
 * This is the inverse of applying a translation and rotation.
 * @param worldPoint The point in world coordinates.
 * @param origin The origin of the local coordinate system in world coordinates.
 * @param rotation The rotation of the local coordinate system relative to the world.
 * @returns The point in local coordinates.
 */
export const worldToLocal = (worldPoint: Point, origin: Point, rotation: number): Point => {
    // Translate the world point so the origin of the local system is at the world origin
    const translatedPoint: Point = {
        x: worldPoint.x - origin.x,
        y: worldPoint.y - origin.y,
    };

    // Rotate the translated point back by the negative of the local system's rotation
    // This is the inverse rotation
    const cosTheta = Math.cos(-rotation);
    const sinTheta = Math.sin(-rotation);

    const localPoint: Point = {
        x: translatedPoint.x * cosTheta - translatedY * sinTheta,
        y: translatedX * sinTheta + translatedY * cosTheta,
    };

    return localPoint;
};


/**
 * Draws a stickman figure on the canvas.
 * @param ctx The canvas rendering context.
 * @param stickman The stickman data to draw.
 * @param selectedPart The currently selected part for highlighting.
 */
export const drawStickman = (ctx: CanvasRenderingContext2D, stickman: Stickman, selectedPart: SelectedPart | null) => {
    // Save the context state before drawing the entire stickman
    ctx.save();

    // Apply stickman's global transformation (translation and rotation based on body)
    ctx.translate(stickman.body.position.x, stickman.body.position.y);
    ctx.rotate(stickman.body.rotation);

    // Draw Body
    ctx.save(); // Save context for drawing body

    // Check if body is selected or at limits and set strokeStyle
    let isBodySelected = selectedPart?.type === 'body' && selectedPart.stickmanId === stickman.id && selectedPart.partId === stickman.body.id;
    let isBodyAtLimit = false;
     // Check body position limits
    if (stickman.body.minPosition || stickman.body.maxPosition) {
         const clampedPosition = { ...stickman.body.position };
          if (stickman.body.minPosition) {
             if (clampedPosition.x <= stickman.body.minPosition.x || clampedPosition.y <= stickman.body.minPosition.y) isBodyAtLimit = true;
          }
          if (stickman.body.maxPosition) {
             if (clampedPosition.x >= stickman.body.maxPosition.x || clampedPosition.y >= stickman.body.maxPosition.y) isBodyAtLimit = true;
          }
    }
     // Check body rotation limits
     if (stickman.body.minRotation !== undefined || stickman.body.maxRotation !== undefined) {
         const clampedRotation = stickman.body.rotation;
          if (stickman.body.minRotation !== undefined && clampedRotation <= stickman.body.minRotation + 0.001) isBodyAtLimit = true; // Add tolerance for floating point
          if (stickman.body.maxRotation !== undefined && clampedRotation >= stickman.body.maxRotation - 0.001) isBodyAtLimit = true; // Add tolerance for floating point
     }


     if (isBodyAtLimit) {
        ctx.strokeStyle = LIMIT_COLOR;
     } else if (isBodySelected) {
        ctx.strokeStyle = SELECTION_COLOR;
     } else {
         ctx.strokeStyle = stickman.body.strokeStyle || 'black'; // Use custom or default color
     }

    ctx.lineWidth = stickman.body.lineWidth || 10; // Use custom or default thickness
    ctx.strokeRect(-stickman.body.width / 2, -stickman.body.height / 2, stickman.body.width, stickman.body.height); // Draw from center
    ctx.restore(); // Restore context after drawing body


    // Draw Head (relative to body connection point and body rotation)
    ctx.save(); // Save context for drawing head
    const headConnection = stickman.body.connectionPoints.head;
    ctx.translate(headConnection.x, headConnection.y); // Translate to connection point relative to body center
    ctx.rotate(stickman.head.rotation); // Rotate by head's rotation relative to parent
    ctx.translate(stickman.head.position.x, stickman.head.position.y); // Translate by head's relative position

    // Check if head is selected or at limits and set strokeStyle
     let isHeadSelected = selectedPart?.type === 'head' && selectedPart.stickmanId === stickman.id && selectedPart.partId === stickman.head.id;
     let isHeadAtLimit = false;
     // Check head position limits
    if (stickman.head.minPosition || stickman.head.maxPosition) {
         const clampedPosition = { ...stickman.head.position };
          if (stickman.head.minPosition) {
             if (clampedPosition.x <= stickman.head.minPosition.x || clampedPosition.y <= stickman.head.minPosition.y) isHeadAtLimit = true;
          }
          if (stickman.head.maxPosition) {
             if (clampedPosition.x >= stickman.head.maxPosition.x || clampedPosition.y >= stickman.head.maxPosition.y) isHeadAtLimit = true;
          }
    }
    // Check head rotation limits
     if (stickman.head.minRotation !== undefined || stickman.head.maxRotation !== undefined) {
         const clampedRotation = stickman.head.rotation; // Assume current rotation is already clamped
          if (stickman.head.minRotation !== undefined && clampedRotation <= stickman.head.minRotation + 0.001) isHeadAtLimit = true;
          if (stickman.head.maxRotation !== undefined && clampedRotation >= stickman.head.maxRotation - 0.001) isHeadAtLimit = true;
     }


     if (isHeadAtLimit) {
        ctx.strokeStyle = LIMIT_COLOR;
     } else if (isHeadSelected) {
        ctx.strokeStyle = SELECTION_COLOR;
     } else {
        ctx.strokeStyle = stickman.head.strokeStyle || 'black'; // Use custom or default color
     }


    ctx.lineWidth = stickman.head.lineWidth || stickman.head.radius / 5; // Use custom or default thickness (or based on radius)
    ctx.beginPath();
    ctx.arc(0, 0, stickman.head.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore(); // Restore context after drawing head


    // Draw Limbs and Segments (recursive)
    for (const limb of stickman.limbs) {
        ctx.save(); // Save context before drawing each limb

        // Translate to the limb's connection point on the body (relative to body's local origin)
        ctx.translate(limb.connectionPoint.x, limb.connectionPoint.y);

        for (const segment of limb.segments) {
             ctx.save(); // Save context before drawing each segment

             // Rotate by the segment's rotation (relative to its parent's rotation)
             ctx.rotate(segment.rotation);

             // Check if segment is selected or at limits and set strokeStyle
             let isSegmentSelected = selectedPart?.type === 'segment' && selectedPart.stickmanId === stickman.id && selectedPart.partId === segment.id;
             let isSegmentAtLimit = false;
              // Check segment rotation limits
              if (segment.minRotation !== undefined || segment.maxRotation !== undefined) {
                 const clampedRotation = segment.rotation; // Assume current rotation is already clamped
                  if (segment.minRotation !== undefined && clampedRotation <= segment.minRotation + 0.001) isSegmentAtLimit = true;
                  if (segment.maxRotation !== undefined && clampedRotation >= segment.maxRotation - 0.001) isSegmentAtLimit = true;
              }


             if (isSegmentAtLimit) {
                ctx.strokeStyle = LIMIT_COLOR;
             } else if (isSegmentSelected) {
                ctx.strokeStyle = SELECTION_COLOR;
             } else {
                ctx.strokeStyle = segment.strokeStyle || 'black'; // Use custom or default color
             }


             ctx.lineWidth = segment.lineWidth || segment.thickness; // Use custom or default thickness
             ctx.beginPath();
             ctx.moveTo(0, 0);
             ctx.lineTo(segment.length, 0); // Segments are drawn horizontally in their local space
             ctx.stroke();

             // Translate to the end of the segment for the next segment or endpoint
             ctx.translate(segment.length, 0);

             ctx.restore(); // Restore context after drawing segment
        }

        ctx.restore(); // Restore context after drawing limb
    }


    ctx.restore(); // Restore the initial context state
};