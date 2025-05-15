// src/components/StickmanCanvas.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Stickman, Point, Limb, Segment } from '@/types/stickman';
import { drawStickman, rotatePoint, getAbsolutePosition, getSegmentEndpoint } from '@/utils/drawing';


// Define a type for the currently selected part
interface SelectedPart {
    type: 'body' | 'head' | 'segment';
    stickmanId: string;
    partId: string; // body.id, head.id, or segment.id
    limbId?: string; // Required if type is 'segment'
    initialMousePos: Point;
    initialPartPosition?: Point; // Initial position if manipulating position (for body/head)
    initialPartRotation?: number; // Initial rotation if manipulating rotation (for segments)
    segmentStartAbsolute?: Point; // Absolute start point of the segment when selected (for rotation)
    isAtLimit?: boolean; // Flag to indicate if a segment is at its rotation limit
}

interface StickmanCanvasProps {
    stickmen: Stickman[]; // Array of stickmen to draw
    onStickmanUpdate: (updatedStickman: Stickman) => void; // Callback to update stickman state in parent
}

const StickmanCanvas: React.FC<StickmanCanvasProps> = ({ stickmen, onStickmanUpdate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedPart, setSelectedPart] = useState<SelectedPart | null>(null);

    // Define colors for visual feedback
    const selectionColor = '#007bff'; // Blue
    const limitColor = '#dc3545';     // Red

    // Effect to handle drawing when stickmen data changes or selection changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all stickmen
        stickmen.forEach(stickman => {
             // Pass selectedPart and colors to the drawing function
            drawStickmanWithFeedback(ctx, stickman, selectedPart, selectionColor, limitColor);
        });

    }, [stickmen, selectedPart]); // Redraw whenever stickmen data or selection changes

    // Modified drawing function to include feedback logic
    const drawStickmanWithFeedback = (
        ctx: CanvasRenderingContext2D,
        stickman: Stickman,
        selectedPart: SelectedPart | null,
        selectionColor: string,
        limitColor: string
    ) => {
        ctx.save(); // Save the current canvas state

        ctx.lineCap = 'round';


        // --- Draw Body ---
        const bodyAbsolutePosition = stickman.body.position;
        const bodyAbsoluteRotation = stickman.body.rotation;

        const bodyHalfWidth = stickman.body.width / 2;
        const bodyHalfHeight = stickman.body.height / 2;
        const bodyTopLeft = rotatePoint({ x: bodyAbsolutePosition.x - bodyHalfWidth, y: bodyAbsolutePosition.y - bodyHalfHeight }, bodyAbsolutePosition, bodyAbsoluteRotation);

        ctx.translate(bodyTopLeft.x, bodyTopLeft.y);
        ctx.rotate(bodyAbsoluteRotation);

        // Check if body is selected
        if (selectedPart?.type === 'body' && selectedPart.stickmanId === stickman.id && selectedPart.partId === stickman.body.id) {
             ctx.strokeStyle = selectionColor;
        } else {
             ctx.strokeStyle = '#000000'; // Default color
        }
        ctx.lineWidth = 2; // Default line width
        ctx.strokeRect(0, 0, stickman.body.width, stickman.body.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation


        // --- Draw Head ---
        const headConnectionAbsolute = getAbsolutePosition(bodyAbsolutePosition, bodyAbsoluteRotation, stickman.body.connectionPoints.head);
        const headAbsolutePosition = getAbsolutePosition(headConnectionAbsolute, bodyAbsoluteRotation, stickman.head.position);
        const headAbsoluteRotation = bodyAbsoluteRotation + stickman.head.rotation;

        ctx.beginPath();
        ctx.arc(headAbsolutePosition.x, headAbsolutePosition.y, stickman.head.radius, 0, Math.PI * 2);

        // Check if head is selected
        if (selectedPart?.type === 'head' && selectedPart.stickmanId === stickman.id && selectedPart.partId === stickman.head.id) {
             ctx.strokeStyle = selectionColor;
        } else {
             ctx.strokeStyle = '#000000'; // Default color
        }
        ctx.lineWidth = 2; // Default line width
        ctx.stroke();


        // --- Draw Limbs ---
        stickman.limbs.forEach(limb => {
             let parentSegmentEndpointAbsolute = getAbsolutePosition(bodyAbsolutePosition, bodyAbsoluteRotation, limb.connectionPoint);
             let parentAbsoluteRotation = bodyAbsoluteRotation;

            limb.segments.forEach(segment => {
                  const segmentStartAbsolute = parentSegmentEndpointAbsolute;
                  const segmentAbsoluteRotation = parentAbsoluteRotation + segment.rotation;
                  const segmentEndAbsolute = getSegmentEndpoint(segmentStartAbsolute, segment.length, segmentAbsoluteRotation);

                  // Check if segment is selected or at limit
                  let currentSegmentColor = '#000000'; // Default color
                  let currentLineWidth = segment.thickness;

                  if (selectedPart?.type === 'segment' && selectedPart.stickmanId === stickman.id && selectedPart.limbId === limb.id && selectedPart.partId === segment.id) {
                       currentSegmentColor = selectionColor;
                       currentLineWidth = segment.thickness + 2; // Make selected segment thicker
                       if (selectedPart.isAtLimit) {
                           currentSegmentColor = limitColor; // Override with limit color if at limit
                       }
                  }


                  // Draw the segment
                  ctx.beginPath();
                  ctx.moveTo(segmentStartAbsolute.x, segmentStartAbsolute.y);
                  ctx.lineTo(segmentEndAbsolute.x, segmentEndAbsolute.y);
                  ctx.lineWidth = currentLineWidth;
                  ctx.strokeStyle = currentSegmentColor;
                  ctx.stroke();

                  // Update for the next segment in the limb
                  parentSegmentEndpointAbsolute = segmentEndAbsolute;
                  parentAbsoluteRotation = segmentAbsoluteRotation;
            });
        });

        ctx.restore(); // Restore the canvas state
    };


    // Helper function to calculate distance from a point to a line segment
    const distToSegment = (p: Point, a: Point, b: Point): number => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx === 0 && dy === 0) {
            return Math.sqrt(Math.pow(p.x - a.x, 2) + Math.pow(p.y - a.y, 2));
        }

        const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);

        let closestPointOnLine: Point;
        if (t < 0) {
            closestPointOnLine = a;
        } else if (t > 1) {
            closestPointOnLine = b;
        } else {
            closestPointOnLine = {
                x: a.x + t * dx,
                y: a.y + t * dy,
            };
        }

        return Math.sqrt(Math.pow(p.x - closestPointOnLine.x, 2) + Math.pow(p.y - closestPointOnLine.y, 2));
    };


    // Improved helper function for hit detection
    const getPartAtMousePosition = (mousePos: Point): SelectedPart | null => {
        const hitTolerance = 10; // Pixels tolerance

        for (const stickman of stickmen) {
            // Check Body (simple bounding box check - assuming body position is center)
            const bodyAbsolutePosition = stickman.body.position;
            const bodyMinX = bodyAbsolutePosition.x - stickman.body.width / 2;
            const bodyMinY = bodyAbsolutePosition.y - stickman.body.height / 2;
            const bodyMaxX = bodyAbsolutePosition.x + stickman.body.width / 2;
            const bodyMaxY = bodyAbsolutePosition.y + stickman.body.height / 2;

             if (mousePos.x > bodyMinX && mousePos.x < bodyMaxX &&
                 mousePos.y > bodyMinY && mousePos.y < bodyMaxY) {
                 return {
                     type: 'body',
                     stickmanId: stickman.id,
                     partId: stickman.body.id,
                     initialMousePos: mousePos,
                     initialPartPosition: stickman.body.position,
                 };
             }


            // Check Head (simple circle check)
             const headConnectionAbsolute = getAbsolutePosition(stickman.body.position, stickman.body.rotation, stickman.body.connectionPoints.head);
             const headAbsolutePosition = getAbsolutePosition(headConnectionAbsolute, stickman.body.rotation, stickman.head.position);

            const headDist = Math.sqrt(
                Math.pow(mousePos.x - headAbsolutePosition.x, 2) +
                Math.pow(mousePos.y - headAbsolutePosition.y, 2)
            );
            if (headDist < stickman.head.radius + hitTolerance / 2) {
                 return {
                     type: 'head',
                     stickmanId: stickman.id,
                     partId: stickman.head.id,
                     initialMousePos: mousePos,
                     initialPartPosition: stickman.head.position,
                 };
            }


            // Check Limbs/Segments (improved)
            for (const limb of stickman.limbs) {
                 let parentSegmentEndpointAbsolute = getAbsolutePosition(stickman.body.position, stickman.body.rotation, limb.connectionPoint);
                 let parentAbsoluteRotation = stickman.body.rotation;

                for (const segment of limb.segments) {
                      const segmentStartAbsolute = parentSegmentEndpointAbsolute;
                      const segmentAbsoluteRotation = parentAbsoluteRotation + segment.rotation;
                      const segmentEndAbsolute = getSegmentEndpoint(segmentStartAbsolute, segment.length, segmentAbsoluteRotation);

                      const distance = distToSegment(mousePos, segmentStartAbsolute, segmentEndAbsolute);

                      if (distance < segment.thickness / 2 + hitTolerance / 2) {
                           return {
                               type: 'segment',
                               stickmanId: stickman.id,
                               partId: segment.id,
                               limbId: limb.id,
                               initialMousePos: mousePos,
                               initialPartRotation: segment.rotation,
                               segmentStartAbsolute: segmentStartAbsolute,
                               isAtLimit: false, // Initialize isAtLimit to false
                           };
                      }

                      // Update for the next segment
                      parentSegmentEndpointAbsolute = segmentEndAbsolute;
                      parentAbsoluteRotation = segmentAbsoluteRotation;
                }
            }
        }

        return null; // No part found at mouse position
    };


    // Handle mouse down
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mousePos: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        const part = getPartAtMousePosition(mousePos);
        if (part) {
             setSelectedPart(part);
        }
    };

    // Handle mouse move - Modified for Segment Rotation and Limits + Feedback
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!selectedPart) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const currentMousePos: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        // Create an updated copy of the stickmen data
        const updatedStickmen = stickmen.map(stickman => {
            if (stickman.id === selectedPart.stickmanId) {
                const updatedStickman = { ...stickman };

                let newIsAtLimit = false; // Assume not at limit initially for this move

                if (selectedPart.type === 'body' && selectedPart.initialPartPosition) {
                    // Manipulating Body Position
                    const deltaX = currentMousePos.x - selectedPart.initialMousePos.x;
                    const deltaY = currentMousePos.y - selectedPart.initialMousePos.y;
                     updatedStickman.body = {
                         ...stickman.body,
                         position: {
                             x: selectedPart.initialPartPosition.x + deltaX,
                             y: selectedPart.initialPartPosition.y + deltaY,
                         },
                     };

                } else if (selectedPart.type === 'head' && selectedPart.initialPartPosition) {
                     // Manipulating Head Position (assuming relative for now)
                     const deltaX = currentMousePos.x - selectedPart.initialMousePos.x;
                     const deltaY = currentMousePos.y - selectedPart.initialMousePos.y;
                    updatedStickman.head = {
                        ...stickman.head,
                         position: {
                             x: selectedPart.initialPartPosition.x + deltaX,
                             y: selectedPart.initialPartPosition.y + deltaY,
                         },
                    };

                } else if (selectedPart.type === 'segment' && selectedPart.limbId && selectedPart.initialPartRotation !== undefined && selectedPart.segmentStartAbsolute) {
                    // Manipulating Segment Rotation
                    const initialAngle = Math.atan2(selectedPart.initialMousePos.y - selectedPart.segmentStartAbsolute.y, selectedPart.initialMousePos.x - selectedPart.segmentStartAbsolute.x);
                    const currentAngle = Math.atan2(currentMousePos.y - selectedPart.segmentStartAbsolute.y, currentMousePos.x - selectedPart.segmentStartAbsolute.x);
                    let angleDelta = currentAngle - initialAngle;

                    // Handle wrapping around 2*PI
                     while (angleDelta > Math.PI) angleDelta -= 2 * Math.PI;
                     while (angleDelta < -Math.PI) angleDelta += 2 * Math.PI;

                     const newRotation = selectedPart.initialPartRotation + angleDelta;

                    updatedStickman.limbs = updatedStickman.limbs.map(limb => {
                        if (limb.id === selectedPart.limbId) {
                            return {
                                ...limb,
                                segments: limb.segments.map(segment => {
                                    if (segment.id === selectedPart.partId) {
                                        // Apply rotation limits
                                        let clampedRotation = newRotation;
                                        let wasClamped = false;
                                        if (segment.minRotation !== undefined && clampedRotation < segment.minRotation) {
                                            clampedRotation = segment.minRotation;
                                            wasClamped = true;
                                        }
                                        if (segment.maxRotation !== undefined && clampedRotation > segment.maxRotation) {
                                            clampedRotation = segment.maxRotation;
                                            wasClamped = true;
                                        }

                                        // Set the newIsAtLimit flag if clamping occurred
                                        if (wasClamped) {
                                            newIsAtLimit = true;
                                        }


                                        return {
                                            ...segment,
                                            rotation: clampedRotation,
                                        };
                                    }
                                    return segment;
                                }),
                            };
                        }
                        return limb;
                    });
                }

                 // Update the selectedPart state's isAtLimit flag
                 // Need to do this outside the map if we want to trigger a state update here
                 // However, we can update the selectedPart state after the stickman state is updated.
                 // For now, we'll just return the updated stickman. The selection state update
                 // will happen after onStickmanUpdate.
                 return updatedStickman;
            }
            return stickman;
        });

        const stickmanToUpdate = updatedStickmen.find(s => s.id === selectedPart.stickmanId);
        if (stickmanToUpdate) {
            // Before calling onStickmanUpdate, update the selectedPart state with the limit status
             if (selectedPart.type === 'segment') {
                  const updatedSegment = stickmanToUpdate.limbs
                     .find(l => l.id === selectedPart.limbId)
                     ?.segments.find(s => s.id === selectedPart.partId);

                  if (updatedSegment) {
                       const isClamped =
                            (updatedSegment.minRotation !== undefined && updatedSegment.rotation === updatedSegment.minRotation) ||
                            (updatedSegment.maxRotation !== undefined && updatedSegment.rotation === updatedSegment.maxRotation);

                       // Only update selectedPart state if the limit status has changed
                       if (selectedPart.isAtLimit !== isClamped) {
                           setSelectedPart(prev => prev ? { ...prev, isAtLimit: isClamped } : null);
                       }
                  }
             }

            onStickmanUpdate(stickmanToUpdate);
        }
    };

    // Handle mouse up
    const handleMouseUp = () => {
        setSelectedPart(null); // Clear the selection
    };

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ border: '1px solid black' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        ></canvas>
    );
};

export default StickmanCanvas;