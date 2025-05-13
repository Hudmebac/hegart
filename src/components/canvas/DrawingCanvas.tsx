
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

      const effectiveLineWidth = lineWidth + currentLineWidthOffset;
      // If effective line width is too small (e.g., less than 0.1px), don't draw it.
      // This creates the "no display" part of the pulse effect.
      if (effectiveLineWidth < 0.1) {
        return;
      }

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = effectiveLineWidth; // Use the calculated effective line width
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
         const pulseCycle = (time / (1000 / (animationSettings.pulseSpeed / 2))) % (2 * Math.PI);
         currentLineWidthOffset = Math.cos(pulseCycle) * animationSettings.pulseIntensity;
       }

      let currentScaleFactor = 1;
      if (animationSettings.isScaling) {
         const scaleCycle = (time / (1000 / (animationSettings.scaleSpeed / 2))) % (2 * Math.PI);
         currentScaleFactor = 1 + Math.sin(scaleCycle) * animationSettings.scaleIntensity;
       }

       if (animationSettings.isSpinning && deltaTime > 0) {
           const now = performance.now();
           // Initialize lastSpinDirectionChangeTime on first spin or if reset
            if (lastSpinDirectionChangeTime.current === 0 && animationSettings.spinDirectionChangeFrequency > 0) {
                lastSpinDirectionChangeTime.current = now;
            }

           const timeSinceLastChange = (now - lastSpinDirectionChangeTime.current) / 1000;

           if (animationSettings.spinDirectionChangeFrequency > 0 &&
               timeSinceLastChange >= animationSettings.spinDirectionChangeFrequency) {
               if (Math.random() < 0.5) {
                   spinDirection.current *= -1;
               }
               lastSpinDirectionChangeTime.current = now; // Reset timer for next change check
           }

           const rotationDegreesPerSecond = animationSettings.spinSpeed * spinDirection.current;
           const rotationRadiansPerSecond = rotationDegreesPerSecond * (Math.PI / 180);
           const rotationThisFrame = rotationRadiansPerSecond * (deltaTime / 1000);
           totalRotation.current += rotationThisFrame;
       } else if (!animationSettings.isSpinning) {
            // If spinning stops, reset relevant spin state
            totalRotation.current = 0;
            // spinDirection.current = 1; // Keep current direction if spinSpeed is just 0. Or reset.
            // For simplicity, let's allow spinSpeed to control direction and reset spinDirection.current if speed becomes 0 or spinning is toggled off.
            lastSpinDirectionChangeTime.current = 0; // Reset for next time spinning starts
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

      if (isDrawing && currentPath.length > 0) {
          const isShapePreview = shapeSettings.currentShape !== 'freehand';
          drawSymmetricPath({
              points: currentPath,
              color: drawingTools.strokeColor,
              lineWidth: drawingTools.lineWidth,
          }, isShapePreview);
      }
      // --- End Draw Content ---

      ctx.restore();

      if (animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null;
        // Reset spin-related states only if spinning is explicitly off,
        // not just because other animations are also off.
        if (!animationSettings.isSpinning) {
          totalRotation.current = 0;
          spinDirection.current = 1; // Default direction
          lastSpinDirectionChangeTime.current = 0;
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
    }, [backgroundColor]); // Only re-setup observer on background change (rare, usually for full redraw)

     useEffect(() => {
       renderCanvas(); // Initial render, or re-render if settings change

       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning;

       if (shouldAnimate && !animationFrameId.current) {
         lastAnimationTime.current = performance.now();
         // Reset spin direction timer if spinning starts and frequency is involved
         if (animationSettings.isSpinning && animationSettings.spinDirectionChangeFrequency > 0) {
            lastSpinDirectionChangeTime.current = performance.now();
         } else if (!animationSettings.isSpinning) {
            // If spinning is not active, ensure rotation is reset
            totalRotation.current = 0;
            spinDirection.current = 1; // Reset to default direction
            lastSpinDirectionChangeTime.current = 0; // Reset timer
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
         // Explicitly reset spin state when all animations are stopped to ensure clean state
         totalRotation.current = 0;
         spinDirection.current = 1;
         lastSpinDirectionChangeTime.current = 0;
         renderCanvas(); // Render one last static frame
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
        onMouseLeave={finishDrawing}
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
