
"use client";

import type { Path } from "@/types/drawing";
import type { DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PreviewCanvasProps {
  completedPaths: Path[]; 
  drawingTools: DrawingTools; 
  mainCanvasDimensions: { width: number; height: number }; 
}

export const PreviewCanvas = ({
  completedPaths,
  drawingTools,
  mainCanvasDimensions,
}: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { theme, systemTheme } = useTheme();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  
  const resetPanZoom = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && canvas) {
          canvas.width = width;
          canvas.height = height;
          // Trigger re-draw, which is handled by the main drawing useEffect
        }
      }
    });
    
    if (wrapperRef.current.clientWidth > 0 && wrapperRef.current.clientHeight > 0) {
        canvas.width = wrapperRef.current.clientWidth;
        canvas.height = wrapperRef.current.clientHeight;
    }
    
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, []);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;

    // Ensure canvas has dimensions, otherwise drawing context might fail
    if (canvas.width === 0 || canvas.height === 0) {
        if (wrapperRef.current.clientWidth > 0 && wrapperRef.current.clientHeight > 0) {
            canvas.width = wrapperRef.current.clientWidth;
            canvas.height = wrapperRef.current.clientHeight;
        } else {
            return; // Not ready
        }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    const backgroundColor = drawingTools.backgroundColor;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) {
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = isDarkMode ? '#555555' : '#AAAAAA';
        ctx.fillText("Main canvas not ready", canvas.width / 2, canvas.height / 2);
        return;
    }
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y);
    ctx.translate(-mainCanvasDimensions.width / 2, -mainCanvasDimensions.height / 2);

    if (completedPaths && completedPaths.length > 0) {
      completedPaths.forEach(path => {
        if (path.points.length >= 1) {
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.strokeStyle = path.color; 
          ctx.lineWidth = Math.max(0.1, path.lineWidth / zoomLevel);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
    } else {
      ctx.restore(); 
      ctx.save(); 
      ctx.font = `bold 10px Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = isDarkMode ? '#555555' : '#AAAAAA';
      ctx.fillText("No drawing yet", canvas.width / 2, canvas.height / 2);
    }
    ctx.restore();

  }, [completedPaths, drawingTools.backgroundColor, theme, systemTheme, panOffset, zoomLevel, mainCanvasDimensions, canvasRef, wrapperRef]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || !lastMousePosition || !canvasRef.current) return;
    const dx = event.clientX - lastMousePosition.x;
    const dy = event.clientY - lastMousePosition.y;
    setPanOffset(prev => ({
      x: prev.x + dx / zoomLevel, 
      y: prev.y + dy / zoomLevel,
    }));
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUpOrLeave = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(false);
    setLastMousePosition(null);
    event.currentTarget.style.cursor = 'grab';
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleAmount = 1.1;
    const newZoomLevelNoClamp = event.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10)); 

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldXBefore = (mouseX - canvas.width / 2) / zoomLevel - panOffset.x + mainCanvasDimensions.width / 2;
    const worldYBefore = (mouseY - canvas.height / 2) / zoomLevel - panOffset.y + mainCanvasDimensions.height / 2;

    const newPanX = (mouseX - canvas.width / 2) / newZoomLevel - worldXBefore + mainCanvasDimensions.width / 2;
    const newPanY = (mouseY - canvas.height / 2) / newZoomLevel - worldYBefore + mainCanvasDimensions.height / 2;

    setPanOffset({x: -newPanX, y: -newPanY});
    setZoomLevel(newZoomLevel);
  };
  
  const manualZoom = (direction: 'in' | 'out') => {
    const scaleAmount = 1.2;
    const newZoomLevelNoClamp = direction === 'in' ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10));
    setZoomLevel(newZoomLevel);
  };


  const cursorStyle = isPanning ? 'grabbing' : 'grab';

  return (
    <TooltipProvider>
    <div
      ref={wrapperRef}
      className="relative group/preview w-full h-full flex flex-col"
      data-ai-hint="drawing preview zoom pan"
    >
      <canvas
        ref={canvasRef}
        className="block flex-grow w-full h-auto cursor-grab active:cursor-grabbing rounded-sm"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
      />
      <div className="absolute top-1 right-1 flex gap-0.5 items-center backdrop-blur-sm bg-background/30 p-0.5 rounded">
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => manualZoom('in')} className="h-5 w-5 p-0.5"><ZoomIn className="h-3 w-3"/></Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Zoom In</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => manualZoom('out')} className="h-5 w-5 p-0.5"><ZoomOut className="h-3 w-3"/></Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Zoom Out</p></TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                 <Button variant="ghost" size="icon" onClick={resetPanZoom} className="h-5 w-5 p-0.5"><RotateCcw className="h-3 w-3"/></Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Reset View</p></TooltipContent>
        </Tooltip>
      </div>
      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover/preview:opacity-100 transition-opacity bg-background/30 px-1.5 py-0.5 rounded text-[10px]">
         Pan: Drag, Zoom: Scroll
       </div>
    </div>
    </TooltipProvider>
  );
};
