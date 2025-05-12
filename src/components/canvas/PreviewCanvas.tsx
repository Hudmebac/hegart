
"use client";

import type { Point, Path } from "@/types/drawing";
import type { DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";

interface PreviewCanvasProps {
  // activePath: Point[]; // Removed - Not needed for userDrawn mode
  completedPaths: Path[]; // All paths already added to the main canvas
  drawingTools: DrawingTools; // Still needed for background color
  mainCanvasDimensions: { width: number; height: number }; // Dimensions of the main canvas for scaling
  // previewMode: PreviewMode; // Removed
}

export const PreviewCanvas = ({
  // activePath, // Removed
  completedPaths,
  drawingTools,
  mainCanvasDimensions,
  // previewMode // Removed
}: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, systemTheme } = useTheme();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 160, height: 90 }); // Default, will be updated

  // Removed effect that reset pan/zoom based on previewMode

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
      if (parent.clientWidth > 0 && parent.clientHeight > 0) {
        setPreviewDimensions({ width: parent.clientWidth, height: parent.clientHeight });
      }
    });
    resizeObserver.observe(parent);
    if (parent.clientWidth > 0 && parent.clientHeight > 0) {
      setPreviewDimensions({ width: parent.clientWidth, height: parent.clientHeight });
    }

    return () => resizeObserver.unobserve(parent);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || previewDimensions.width === 0 || previewDimensions.height === 0) return;

    canvas.width = previewDimensions.width;
    canvas.height = previewDimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    const backgroundColor = drawingTools.backgroundColor; // Use tool's background

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- User Drawn Path Preview Logic (all completedPaths) ---
    if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) return;

    ctx.save();
    ctx.translate(previewDimensions.width / 2, previewDimensions.height / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y);
    ctx.translate(-previewDimensions.width / (2 * zoomLevel), -previewDimensions.height / (2 * zoomLevel));


    // Scale content from main canvas to fit preview canvas
    const scaleToFitX = previewDimensions.width / mainCanvasDimensions.width;
    const scaleToFitY = previewDimensions.height / mainCanvasDimensions.height;
    const commonScaleToFit = Math.min(scaleToFitX, scaleToFitY);
    ctx.scale(commonScaleToFit, commonScaleToFit);

    if (completedPaths && completedPaths.length > 0) {
      completedPaths.forEach(path => {
        if (path.points.length >= 1) {
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.strokeStyle = path.color; // Use path's own color
          ctx.lineWidth = Math.max(1, path.lineWidth / commonScaleToFit / zoomLevel);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      });
    } else {
      ctx.restore(); // Restore before drawing text if no paths
      ctx.save(); // Save again for text
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = isDarkMode ? '#555555' : '#AAAAAA';
      ctx.fillText("No drawing yet", canvas.width / 2, canvas.height / 2);
    }
    ctx.restore();


  }, [completedPaths, drawingTools.backgroundColor, theme, systemTheme, panOffset, zoomLevel, previewDimensions, mainCanvasDimensions]); // Removed activePath and previewMode

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Always allow panning
    setIsPanning(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Always allow panning move
    if (!isPanning || !lastMousePosition) return;
    const dx = event.clientX - lastMousePosition.x;
    const dy = event.clientY - lastMousePosition.y;
    setPanOffset(prev => ({
      x: prev.x + dx / zoomLevel, // Panning is inversely affected by zoom
      y: prev.y + dy / zoomLevel,
    }));
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUpOrLeave = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Always reset panning state
    setIsPanning(false);
    setLastMousePosition(null);
    event.currentTarget.style.cursor = 'grab';
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    // Always allow zooming
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleAmount = 1.1;
    const newZoomLevelNoClamp = event.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10)); // Clamp zoom

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const previewCenterX = previewDimensions.width / 2;
    const previewCenterY = previewDimensions.height / 2;

    const newPanX = mouseX - previewCenterX - (mouseX - previewCenterX - panOffset.x) * (newZoomLevel / zoomLevel);
    const newPanY = mouseY - previewCenterY - (mouseY - previewCenterY - panOffset.y) * (newZoomLevel / zoomLevel);

    setPanOffset({x: newPanX, y: newPanY});
    setZoomLevel(newZoomLevel);
  };

  // Set cursor style directly for pan/zoom behavior
  const cursorStyle = isPanning ? 'grabbing' : 'grab';

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full block"
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      data-ai-hint="drawing preview zoom pan"
    />
  );
};
