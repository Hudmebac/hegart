
"use client";

import type { Path } from "@/types/drawing";
import type { DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"; // Added ZoomIn, ZoomOut, RotateCcw for pan/zoom controls
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
  
  const [previewDimensions, setPreviewDimensions] = useState({ width: 160, height: 90 }); 
  const [isMaximized, setIsMaximized] = useState(false);

  const resetPanZoom = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;
    
    const parentToObserve = isMaximized ? document.body : wrapperRef.current.parentElement;
    if (!parentToObserve) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isMaximized) {
        // For maximized view, we might want fixed dimensions or based on viewport percentage
        // For simplicity, let's use the fixed dimensions defined in className
        // but ensure canvas drawing area is updated if its CSS dimensions change
         if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
           setPreviewDimensions({ width: canvas.clientWidth, height: canvas.clientHeight});
         }
      } else if (wrapperRef.current?.parentElement) {
         const parentEl = wrapperRef.current.parentElement;
         if (parentEl.clientWidth > 0 && parentEl.clientHeight > 0) {
           setPreviewDimensions({ width: parentEl.clientWidth, height: parentEl.clientHeight });
         }
      }
    });

    if (isMaximized) {
        // Set initial dimensions for maximized state
        // These are fallback if CSS doesn't immediately provide clientWidth/Height
        setPreviewDimensions({ width: 400, height: 300 }); 
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
             setPreviewDimensions({ width: canvas.clientWidth, height: canvas.clientHeight });
        }
    } else if (wrapperRef.current?.parentElement) {
        const parentEl = wrapperRef.current.parentElement;
        if (parentEl.clientWidth > 0 && parentEl.clientHeight > 0) {
            setPreviewDimensions({ width: parentEl.clientWidth, height: parentEl.clientHeight });
        }
    }
    
    // Observe the canvas itself for maximized state if it's controlling its own size via CSS
    // or its wrapper for minimized state
    resizeObserver.observe(isMaximized ? canvas : wrapperRef.current);


    return () => resizeObserver.disconnect();
  }, [isMaximized]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || previewDimensions.width === 0 || previewDimensions.height === 0) return;

    canvas.width = previewDimensions.width;
    canvas.height = previewDimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    const backgroundColor = drawingTools.backgroundColor;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) {
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = isDarkMode ? '#555555' : '#AAAAAA';
        ctx.fillText("Drawing area not ready", canvas.width / 2, canvas.height / 2);
        return;
    }
    
    ctx.save();

    // Apply pan and zoom transformations relative to the center of the preview canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y); // Pan is applied in the scaled coordinate system
    // Translate so that (0,0) of main canvas content is at top-left of scaled+panned view
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
          ctx.lineWidth = Math.max(0.1, path.lineWidth / zoomLevel); // Scale line width inversely to zoom
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
    } else {
      ctx.restore(); 
      ctx.save(); 
      ctx.font = `bold ${isMaximized ? '16px' : '12px'} Arial`;
      ctx.textAlign = "center";
      ctx.fillStyle = isDarkMode ? '#555555' : '#AAAAAA';
      ctx.fillText("No drawing yet", canvas.width / 2, canvas.height / 2);
    }
    ctx.restore();

  }, [completedPaths, drawingTools.backgroundColor, theme, systemTheme, panOffset, zoomLevel, previewDimensions, mainCanvasDimensions]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning || !lastMousePosition) return;
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
    // Mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Point in world coordinates before zoom
    const worldXBefore = (mouseX - previewDimensions.width / 2) / zoomLevel - panOffset.x + mainCanvasDimensions.width / 2;
    const worldYBefore = (mouseY - previewDimensions.height / 2) / zoomLevel - panOffset.y + mainCanvasDimensions.height / 2;

    // New panOffset to keep worldX/Y at the same mouse position after zoom
    const newPanX = (mouseX - previewDimensions.width / 2) / newZoomLevel - worldXBefore + mainCanvasDimensions.width / 2;
    const newPanY = (mouseY - previewDimensions.height / 2) / newZoomLevel - worldYBefore + mainCanvasDimensions.height / 2;

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
      className={cn(
        "relative group/preview", 
        isMaximized
          ? "fixed top-4 right-4 w-[clamp(300px,30vw,500px)] h-[clamp(200px,25vw,400px)] bg-card border-2 border-primary shadow-2xl z-[100] rounded-lg p-1 flex flex-col"
          : "w-full h-full" 
      )}
      data-ai-hint="drawing preview zoom pan"
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "block rounded-sm", // Added rounded-sm to canvas itself for maximized view
          isMaximized ? "flex-grow w-full h-auto cursor-grab active:cursor-grabbing" : "w-full h-full cursor-grab active:cursor-grabbing"
        )}
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
      />
      <div className={cn(
          "absolute flex gap-1 items-center",
          isMaximized ? "top-2 right-2 backdrop-blur-sm bg-background/50 p-1 rounded" : "top-1 right-1"
      )}>
        {isMaximized && (
          <>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => manualZoom('in')} className="h-6 w-6 p-0.5"><ZoomIn className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom In</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => manualZoom('out')} className="h-6 w-6 p-0.5"><ZoomOut className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Zoom Out</p></TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" onClick={resetPanZoom} className="h-6 w-6 p-0.5"><RotateCcw className="h-4 w-4"/></Button>
                </TooltipTrigger>
                <TooltipContent><p>Reset View</p></TooltipContent>
            </Tooltip>
          </>
        )}
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                        setIsMaximized(!isMaximized);
                        if (isMaximized) resetPanZoom(); // Reset pan/zoom when minimizing
                    }}
                    className="h-6 w-6 p-0.5"
                >
                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>{isMaximized ? "Minimize" : "Maximize"} Preview</p></TooltipContent>
        </Tooltip>
      </div>
        {!isMaximized && (
           <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover/preview:opacity-100 transition-opacity bg-background/50 px-2 py-0.5 rounded">
             Pan: Drag, Zoom: Scroll. Click Maximize for more controls.
           </div>
        )}
    </div>
    </TooltipProvider>
  );
};
