
"use client";

import type { Point, Path } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings } from "@/components/AppClient";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { drawShape } from './shapeUtils'; // Import shape drawing utility

interface DrawingCanvasProps {
  paths: Path[];
  currentPath: Point[]; // Receive current path as prop
  onCurrentPathChange: (path: Point[]) => void; // Receive handler to update current path
  onPathAdd: (path: Path) => void;
  symmetrySettings: SymmetrySettings;
  animationSettings: AnimationSettings;
  drawingTools: DrawingTools;
  shapeSettings: ShapeSettings; // Receive shape settings
  backgroundColor: string;
}

export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({
    paths,
    currentPath, // Use prop
    onCurrentPathChange, // Use prop
    onPathAdd,
    symmetrySettings,
    animationSettings,
    drawingTools,
    shapeSettings, // Use prop
    backgroundColor
  }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    const [isDrawing, setIsDrawing] = useState(false);
    const animationFrameId = useRef<number | null>(null);
    const lastAnimationTime = useRef<number>(0);
    const totalRotation = useRef<number>(0);
    const spinDirection = useRef<number>(1); // 1 for CW, -1 for CCW
    const lastSpinDirectionChangeTime = useRef<number>(0);

    const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
      if (!internalCanvasRef.current) return null;
      const canvas = internalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ('touches' in event) {
         if (event.touches.length === 0) return null;
         x = event.touches[0].clientX - rect.left;
         y = event.touches[0].clientY - rect.top;
       } else {
         x = event.clientX - rect.left;
         y = event.clientY - rect.top;
       }
      x = Math.max(0, Math.min(x, canvas.width));
      y = Math.max(0, Math.min(y, canvas.height));
      return { x, y };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
       if ('touches' in event) {
           event.preventDefault();
       }
      const point = getCanvasCoordinates(event);
      if (!point) return;
      setIsDrawing(true);
      onCurrentPathChange([point]); // Start new path using prop handler
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
       if ('touches' in event) {
           event.preventDefault();
       }
      if (!isDrawing) return;
      const point = getCanvasCoordinates(event);
      if (!point) return;
      // Update current path using prop handler
      if (shapeSettings.currentShape === 'freehand') {
          onCurrentPathChange([...currentPath, point]);
      } else {
          // For shapes, only update the second point (end point)
          if (currentPath.length > 0) {
              onCurrentPathChange([currentPath[0], point]);
          }
      }
    };

    const finishDrawing = () => {
      if (!isDrawing || currentPath.length === 0) return;
      setIsDrawing(false);

      let finalPathPoints: Point[];
      if (shapeSettings.currentShape !== 'freehand' && currentPath.length === 2) {
          // Generate shape points based on start and end points
          const canvas = internalCanvasRef.current;
          if (!canvas) return;
          finalPathPoints = drawShape(shapeSettings.currentShape, currentPath[0], currentPath[1], canvas.width, canvas.height);
      } else {
          // Use the drawn points for freehand
          finalPathPoints = currentPath;
      }


       if (finalPathPoints.length >= 2) { // Only add if path has at least 2 points
          onPathAdd({
            points: finalPathPoints,
            color: drawingTools.strokeColor,
            lineWidth: drawingTools.lineWidth,
          });
       }

      onCurrentPathChange([]); // Clear current path using prop handler
    };


    const drawSinglePath = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number, currentLineWidthOffset: number = 0) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, lineWidth + currentLineWidthOffset);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

     // Function to draw the temporary shape line while drawing
      const drawTemporaryShapeLine = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number) => {
          if (path.length !== 2) return; // Only draw if start and end points exist
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          ctx.lineTo(path[1].x, path[1].y);
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1, lineWidth * 0.5); // Make preview line thinner
          ctx.setLineDash([5, 5]); // Make it dashed
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
      };


    const renderCanvas = (time: number = 0) => {
      if (!internalCanvasRef.current) return;
      const canvas = internalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const deltaTime = time - lastAnimationTime.current;
      lastAnimationTime.current = time;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // --- Calculate Animation Values ---
      let currentLineWidthOffset = 0;
       if (animationSettings.isPulsing) {
         // Use cosine: starts at max offset, goes to min, then back to max
         // pulseIntensity controls the range (+/- pulseIntensity)
         const pulseCycle = (time / (1000 / (animationSettings.pulseSpeed / 2))) % (2 * Math.PI);
         currentLineWidthOffset = Math.cos(pulseCycle) * animationSettings.pulseIntensity; // Oscillates between +intensity and -intensity
       }

      let currentScaleFactor = 1;
      if (animationSettings.isScaling) {
         const scaleCycle = (time / (1000 / (animationSettings.scaleSpeed / 2))) % (2 * Math.PI);
         // Scale oscillates between (1 - intensity) and (1 + intensity)
         currentScaleFactor = 1 + Math.sin(scaleCycle) * animationSettings.scaleIntensity;
       }

       // Spin Animation with Direction Change
       if (animationSettings.isSpinning && deltaTime > 0) {
           const now = performance.now();
           const timeSinceLastChange = (now - lastSpinDirectionChangeTime.current) / 1000; // in seconds

           // Check if direction should change (randomly based on frequency)
           if (animationSettings.spinDirectionChangeFrequency > 0 && timeSinceLastChange > animationSettings.spinDirectionChangeFrequency) {
               if (Math.random() < 0.5) { // 50% chance to change direction
                   spinDirection.current *= -1;
                   lastSpinDirectionChangeTime.current = now;
               } else {
                   // Reset timer even if direction doesn't change, so it checks again later
                   lastSpinDirectionChangeTime.current = now;
               }
           } else if (lastSpinDirectionChangeTime.current === 0) {
                // Initialize the timer on the first frame
                lastSpinDirectionChangeTime.current = now;
           }


           const rotationDegreesPerSecond = animationSettings.spinSpeed * spinDirection.current;
           const rotationRadiansPerSecond = rotationDegreesPerSecond * (Math.PI / 180);
           const rotationThisFrame = rotationRadiansPerSecond * (deltaTime / 1000);
           totalRotation.current += rotationThisFrame;
       }
       const currentRotationAngle = totalRotation.current;
       // --- End Calculate Animation Values ---


      ctx.save();
      ctx.translate(centerX, centerY);
      if (animationSettings.isSpinning) ctx.rotate(currentRotationAngle);
      if (animationSettings.isScaling) ctx.scale(currentScaleFactor, currentScaleFactor);
      ctx.translate(-centerX, -centerY);


      // --- Draw Content ---
      const drawSymmetricPath = (originalPathData: Path | { points: Point[], color: string, lineWidth: number }, isTemporaryShape = false) => {
        const { points: originalPoints, color, lineWidth } = originalPathData;

        // Decide which drawing function to use
        const drawFunc = isTemporaryShape ? drawTemporaryShapeLine : drawSinglePath;

        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;

        for (let i = 0; i < numAxes; i++) {
           const angle = (i * 2 * Math.PI) / numAxes;

           const transformPoint = (p: Point): Point => {
             let { x, y } = p;
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

          const baseTransformedPath = originalPoints.map(transformPoint);
          // Pass animation offset only for non-temporary shapes
          drawFunc(ctx, baseTransformedPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);


           if (symmetrySettings.mirrorX) {
             const mirroredXPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: p.y}));
              drawFunc(ctx, mirroredXPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorY) {
             const mirroredYPath = baseTransformedPath.map(p => ({x: p.x, y: canvas.height - p.y}));
              drawFunc(ctx, mirroredYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorX && symmetrySettings.mirrorY) {
               const mirroredXYPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y}));
              drawFunc(ctx, mirroredXYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
        }
      };

      paths.forEach(pathData => drawSymmetricPath(pathData));

      // Draw the current path (using prop) being drawn with symmetry
      if (isDrawing && currentPath.length > 0) {
          const isShapePreview = shapeSettings.currentShape !== 'freehand';
          drawSymmetricPath({
              points: currentPath,
              color: drawingTools.strokeColor,
              lineWidth: drawingTools.lineWidth,
          }, isShapePreview); // Pass true if it's a shape preview line
      }
      // --- End Draw Content ---

      ctx.restore();

      if (animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null;
         if (!animationSettings.isSpinning) {
             totalRotation.current = 0;
             spinDirection.current = 1; // Reset direction
             lastSpinDirectionChangeTime.current = 0; // Reset timer
         }
      }
    };

    useEffect(() => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const resizeObserver = new ResizeObserver(() => {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        renderCanvas();
      });
      resizeObserver.observe(parent);

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      renderCanvas();

      return () => {
        resizeObserver.unobserve(parent);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor]);

     useEffect(() => {
       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning;
       renderCanvas();

       if (shouldAnimate && !animationFrameId.current) {
         lastAnimationTime.current = performance.now();
         if (!animationSettings.isSpinning) {
            totalRotation.current = 0;
            spinDirection.current = 1;
            lastSpinDirectionChangeTime.current = 0;
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
          totalRotation.current = 0;
          spinDirection.current = 1;
          lastSpinDirectionChangeTime.current = 0;
          renderCanvas(); // Render final static state
       }

       return () => {
         if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
         }
       };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [paths, symmetrySettings, animationSettings, drawingTools, isDrawing, currentPath, backgroundColor, shapeSettings]);


    return (
      <canvas
        ref={internalCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing} // Finish drawing if mouse leaves canvas
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        className="h-full w-full touch-none bg-transparent cursor-crosshair"
        data-ai-hint="abstract art"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
