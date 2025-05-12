
"use client";

import type { Point } from "@/types/drawing";
import type { DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";

interface PreviewCanvasProps {
  currentPath: Point[];
  drawingTools: DrawingTools;
  mainCanvasDimensions: { width: number; height: number };
}

export const PreviewCanvas = ({ currentPath, drawingTools, mainCanvasDimensions }: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, systemTheme } = useTheme();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 160, height: 90 }); // Default, will be updated

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
    const backgroundColor = isDarkMode ? '#121212' : '#FAFAFA';

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) return;

    const scaleToFitX = previewDimensions.width / mainCanvasDimensions.width;
    const scaleToFitY = previewDimensions.height / mainCanvasDimensions.height;
    const commonScaleToFit = Math.min(scaleToFitX, scaleToFitY);

    ctx.save();

    // Apply pan and zoom
    ctx.translate(previewDimensions.width / 2, previewDimensions.height / 2); // Translate to center for zoom
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(panOffset.x, panOffset.y); // Apply pan (panOffset is relative to center, in zoomed space)
    ctx.translate(-previewDimensions.width / (2 * zoomLevel), -previewDimensions.height / (2 * zoomLevel)); // Translate back, accounting for zoom

    // Apply scale to fit main canvas content into preview
    // This ensures the drawing is scaled relative to its original canvas size
    const effectiveScale = commonScaleToFit;
    ctx.scale(effectiveScale, effectiveScale);
    
    // Center the drawing content if main canvas aspect ratio differs from preview aspect ratio
    const scaledContentWidth = mainCanvasDimensions.width * effectiveScale;
    const scaledContentHeight = mainCanvasDimensions.height * effectiveScale;
    // The pan and zoom are relative to the preview canvas center.
    // The commonScaleToFit then scales the entire mainCanvasDimension space.
    // The actual content drawing should happen in original main canvas coordinates.
    // The transformations ensure it's placed and scaled correctly within the preview.

    if (currentPath.length >= 1) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.strokeStyle = drawingTools.strokeColor;
      ctx.lineWidth = Math.max(1, drawingTools.lineWidth / commonScaleToFit / zoomLevel); // Adjust line width based on effective scale
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    ctx.restore();

  }, [currentPath, drawingTools, theme, systemTheme, panOffset, zoomLevel, previewDimensions, mainCanvasDimensions]);

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
      x: prev.x + dx / zoomLevel, // Pan is in the zoomed coordinate system
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
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10)); // Clamp zoom

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left; // Mouse X relative to canvas element
    const mouseY = event.clientY - rect.top;  // Mouse Y relative to canvas element

    // Adjust panOffset to zoom towards the mouse position
    // panOffset is relative to the center of the preview canvas in the zoomed space
    // Convert mouse position from screen space of canvas element to the space panOffset operates in
    
    // (mouseX - previewDimensions.width / 2) is mouse relative to center, in screen pixels
    // We want to find how much the panOffset (which is in "zoomed units relative to center") needs to change
    
    const panXChange = (mouseX - previewDimensions.width / 2) * (1 / zoomLevel - 1 / newZoomLevel);
    const panYChange = (mouseY - previewDimensions.height / 2) * (1 / zoomLevel - 1 / newZoomLevel);

    setPanOffset(prev => ({
        x: prev.x + panXChange,
        y: prev.y + panYChange,
    }));
    setZoomLevel(newZoomLevel);
  };
  
  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full block"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      data-ai-hint="drawing preview zoom pan"
    />
  );
};
