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

    const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
      if (!internalCanvasRef.current) return null;
      const canvas = internalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ('touches' in event) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }
      return { x, y };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      const point = getCanvasCoordinates(event);
      if (!point) return;
      setIsDrawing(true);
      setCurrentPath([point]);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
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
    
    const drawPath = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number, currentAnimationOffset: number = 0) => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth + currentAnimationOffset;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const renderCanvas = (time: number = 0) => {
      if (!internalCanvasRef.current) return;
      const canvas = internalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      let currentAnimationOffset = 0;
      if (animationSettings.isPulsing) {
          const elapsedTime = time - lastAnimationTime.current;
          // Use a sine wave for pulsing effect based on speed and intensity
          // Pulse speed affects frequency, intensity affects amplitude
          const pulseCycle = (elapsedTime / (1000 / (animationSettings.pulseSpeed / 10))) % (2 * Math.PI);
          currentAnimationOffset = Math.sin(pulseCycle) * (animationSettings.pulseIntensity / 2);
      }


      const drawSymmetricPath = (originalPath: Point[], color: string, lineWidth: number) => {
        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;
        for (let i = 0; i < numAxes; i++) {
          const angle = (i * 2 * Math.PI) / numAxes;
          
          const transformPoint = (p: Point): Point => {
            let { x, y } = p;
            // Rotational symmetry
            if (numAxes > 1) {
              const translatedX = x - centerX;
              const translatedY = y - centerY;
              const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
              const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);
              x = rotatedX + centerX;
              y = rotatedY + centerY;
            }
            // Mirror X (across vertical center line)
            if (symmetrySettings.mirrorX && i % 2 === (numAxes > 1 ? 1 : 0) ) { // Apply mirror to alternate rotational segments or if no rotation
                 x = centerX + (centerX - x);
            }
             // Mirror Y (across horizontal center line)
            if (symmetrySettings.mirrorY && i % 2 === (numAxes > 1 ? 1 : 0) ) {
                 y = centerY + (centerY - y);
            }
            return { x, y };
          };

          const transformedPath = originalPath.map(transformPoint);
          drawPath(ctx, transformedPath, color, lineWidth, currentAnimationOffset);

          // Apply X mirror explicitly if no rotation or for the base segment
          if (symmetrySettings.mirrorX) {
            const mirroredXPath = originalPath.map(p => ({x: canvas.width - p.x, y: p.y})).map(transformPoint);
            drawPath(ctx, mirroredXPath, color, lineWidth, currentAnimationOffset);
          }
          // Apply Y mirror explicitly
          if (symmetrySettings.mirrorY) {
            const mirroredYPath = originalPath.map(p => ({x: p.x, y: canvas.height - p.y})).map(transformPoint);
             drawPath(ctx, mirroredYPath, color, lineWidth, currentAnimationOffset);
          }
          if (symmetrySettings.mirrorX && symmetrySettings.mirrorY) {
             const mirroredXYPath = originalPath.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y})).map(transformPoint);
             drawPath(ctx, mirroredXYPath, color, lineWidth, currentAnimationOffset);
          }
        }
      };

      paths.forEach(path => drawSymmetricPath(path.points, path.color, path.lineWidth));
      if (isDrawing && currentPath.length > 0) {
        drawSymmetricPath(currentPath, drawingTools.strokeColor, drawingTools.lineWidth);
      }
      
      if (animationSettings.isPulsing) {
        lastAnimationTime.current = time;
        animationFrameId.current = requestAnimationFrame(renderCanvas);
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
      renderCanvas(); // Initial render

      return () => {
        resizeObserver.unobserve(parent);
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor]); // Re-run if background color changes to correctly fill

    useEffect(() => {
      renderCanvas();
      if (animationSettings.isPulsing && !animationFrameId.current) {
        lastAnimationTime.current = performance.now();
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else if (!animationSettings.isPulsing && animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
        renderCanvas(); // Render one last time without animation offset
      }
      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
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
        className="h-full w-full touch-none bg-transparent"
        data-ai-hint="abstract art"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
