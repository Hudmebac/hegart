
"use client";

import type { Point, Path } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  paths: Path[];
  onPathAdd: (path: Path) => void;
  symmetrySettings: SymmetrySettings;
  animationSettings: AnimationSettings;
  drawingTools: DrawingTools;
  backgroundColor: string;
}

export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({ paths, onPathAdd, symmetrySettings, animationSettings, drawingTools, backgroundColor }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Point[]>([]);
    const animationFrameId = useRef<number | null>(null);
    const lastAnimationTime = useRef<number>(0);
    const totalRotation = useRef<number>(0); // Accumulate rotation over time

    const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
      if (!internalCanvasRef.current) return null;
      const canvas = internalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ('touches' in event) {
         // Use the first touch point
         if (event.touches.length === 0) return null; // No touch points
         x = event.touches[0].clientX - rect.left;
         y = event.touches[0].clientY - rect.top;
       } else {
         x = event.clientX - rect.left;
         y = event.clientY - rect.top;
       }
      // Clamp coordinates to stay within canvas bounds
      x = Math.max(0, Math.min(x, canvas.width));
      y = Math.max(0, Math.min(y, canvas.height));
      return { x, y };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      // Prevent default touch behavior like scrolling
       if ('touches' in event) {
           event.preventDefault();
       }
      const point = getCanvasCoordinates(event);
      if (!point) return;
      setIsDrawing(true);
      setCurrentPath([point]);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
       if ('touches' in event) {
           event.preventDefault();
       }
      if (!isDrawing) return;
      const point = getCanvasCoordinates(event);
      if (!point) return;
      setCurrentPath((prev) => [...prev, point]);
    };

    const finishDrawing = () => {
      if (!isDrawing || currentPath.length === 0) return;
      setIsDrawing(false);
      onPathAdd({
        points: currentPath,
        color: drawingTools.strokeColor,
        lineWidth: drawingTools.lineWidth,
      });
      setCurrentPath([]);
    };

    const drawPath = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number, currentLineWidthOffset: number = 0) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = color;
      // Ensure lineWidth doesn't go below 1
      ctx.lineWidth = Math.max(1, lineWidth + currentLineWidthOffset);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const renderCanvas = (time: number = 0) => {
      if (!internalCanvasRef.current) return;
      const canvas = internalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const deltaTime = time - lastAnimationTime.current; // Time since last frame in ms
      lastAnimationTime.current = time; // Update last time for the next frame

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // --- Calculate Animation Values ---
      let currentLineWidthOffset = 0;
      if (animationSettings.isPulsing) {
        // Sine wave for pulsing line width
        const pulseCycle = (time / (1000 / (animationSettings.pulseSpeed / 2))) % (2 * Math.PI);
        currentLineWidthOffset = Math.sin(pulseCycle) * (animationSettings.pulseIntensity / 2);
      }

      let currentScaleFactor = 1;
      if (animationSettings.isScaling) {
         // Sine wave for pulsing scale, oscillating around 1
         const scaleCycle = (time / (1000 / (animationSettings.scaleSpeed / 2))) % (2 * Math.PI);
         // Intensity controls the amplitude (max deviation from 1)
         currentScaleFactor = 1 + Math.sin(scaleCycle) * animationSettings.scaleIntensity;
       }

      if (animationSettings.isSpinning && deltaTime > 0) {
         const rotationDegreesPerSecond = animationSettings.spinSpeed;
         const rotationRadiansPerSecond = rotationDegreesPerSecond * (Math.PI / 180);
         const rotationThisFrame = rotationRadiansPerSecond * (deltaTime / 1000);
         totalRotation.current += rotationThisFrame;
       }
       const currentRotationAngle = totalRotation.current;
       // --- End Calculate Animation Values ---


      // --- Apply Global Transformations (Rotation, Scaling) ---
      ctx.save(); // Save context state before transformations
      ctx.translate(centerX, centerY); // Move origin to center
      if (animationSettings.isSpinning) {
        ctx.rotate(currentRotationAngle);
      }
       if (animationSettings.isScaling) {
         ctx.scale(currentScaleFactor, currentScaleFactor);
       }
      ctx.translate(-centerX, -centerY); // Move origin back
      // --- End Apply Global Transformations ---


      // --- Draw Content ---
      const drawSymmetricPath = (originalPathData: Path) => {
        const { points: originalPath, color, lineWidth } = originalPathData;
        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;

        for (let i = 0; i < numAxes; i++) {
           const angle = (i * 2 * Math.PI) / numAxes;

           const transformPoint = (p: Point): Point => {
             let { x, y } = p;
             // Center -> Rotate -> Uncenter
             if (numAxes > 1) {
               const translatedX = x - centerX;
               const translatedY = y - centerY;
               const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
               const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);
               x = rotatedX + centerX;
               y = rotatedY + centerY;
             }
             return { x, y };
           };

          const baseTransformedPath = originalPath.map(transformPoint);
          drawPath(ctx, baseTransformedPath, color, lineWidth, currentLineWidthOffset);

           // Handle mirroring *after* rotation to mirror the rotated segment
           if (symmetrySettings.mirrorX) {
             const mirroredXPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: p.y}));
             drawPath(ctx, mirroredXPath, color, lineWidth, currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorY) {
             const mirroredYPath = baseTransformedPath.map(p => ({x: p.x, y: canvas.height - p.y}));
             drawPath(ctx, mirroredYPath, color, lineWidth, currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorX && symmetrySettings.mirrorY) {
               const mirroredXYPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y}));
               drawPath(ctx, mirroredXYPath, color, lineWidth, currentLineWidthOffset);
           }
        }
      };

      paths.forEach(pathData => drawSymmetricPath(pathData));

      if (isDrawing && currentPath.length > 0) {
        // Draw the current path being drawn with symmetry as well
        drawSymmetricPath({
          points: currentPath,
          color: drawingTools.strokeColor,
          lineWidth: drawingTools.lineWidth,
        });
      }
      // --- End Draw Content ---

      ctx.restore(); // Restore context state to remove transformations for next frame

      // Request next frame if any animation is active
      if (animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null; // Stop animation loop if no animations are active
         // Reset accumulated rotation when spinning stops
         if (!animationSettings.isSpinning) {
             totalRotation.current = 0;
         }
      }
    };

    // Resize observer effect
    useEffect(() => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const resizeObserver = new ResizeObserver(() => {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        renderCanvas(); // Re-render on resize
      });
      resizeObserver.observe(parent);

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      renderCanvas(); // Initial render

      return () => {
        resizeObserver.unobserve(parent);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor]); // Re-run only if background color changes

    // Effect to handle drawing updates and animation loop control
     useEffect(() => {
       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning;

       // Always render at least once when dependencies change
       renderCanvas();

       if (shouldAnimate && !animationFrameId.current) {
         // Start the animation loop if it's not running and should be
         lastAnimationTime.current = performance.now(); // Reset timer when starting
         if (!animationSettings.isSpinning) {
            totalRotation.current = 0; // Reset rotation if spinning isn't active
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         // Stop the animation loop if it's running and shouldn't be
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
         // Render one last time without animation offsets/transformations if needed
         // This requires resetting temporary animation values before the final render
          totalRotation.current = 0;
          renderCanvas();
       }

       // Cleanup function to stop animation loop on unmount or before re-running effect
       return () => {
         if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
         }
       };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [paths, symmetrySettings, animationSettings, drawingTools, isDrawing, currentPath, backgroundColor]);


    return (
      <canvas
        ref={internalCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        className="h-full w-full touch-none bg-transparent cursor-crosshair" // Added cursor
        data-ai-hint="abstract art"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
