
"use client";

import type { Point } from "@/types/drawing";
import type { DrawingTools, PreviewMode } from "@/components/AppClient"; // Import PreviewMode
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";

interface PreviewCanvasProps {
  currentPath: Point[];
  drawingTools: DrawingTools;
  mainCanvasDimensions: { width: number; height: number };
  previewMode: PreviewMode; // Receive preview mode
}

export const PreviewCanvas = ({ currentPath, drawingTools, mainCanvasDimensions, previewMode }: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, systemTheme } = useTheme();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 160, height: 90 }); // Default, will be updated

  // Reset pan/zoom when switching to 'stroke' mode
  useEffect(() => {
    if (previewMode === 'stroke') {
      setPanOffset({ x: 0, y: 0 });
      setZoomLevel(1);
    }
  }, [previewMode]);

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

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Conditional Rendering based on previewMode
    if (previewMode === 'userDrawn') {
      // --- User Drawn Path Preview Logic ---
      if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) return;

      const scaleToFitX = previewDimensions.width / mainCanvasDimensions.width;
      const scaleToFitY = previewDimensions.height / mainCanvasDimensions.height;
      const commonScaleToFit = Math.min(scaleToFitX, scaleToFitY);

      ctx.save();

      // Apply pan and zoom
      ctx.translate(previewDimensions.width / 2, previewDimensions.height / 2);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(panOffset.x, panOffset.y);
      ctx.translate(-previewDimensions.width / (2 * zoomLevel), -previewDimensions.height / (2 * zoomLevel));

      // Apply scale to fit main canvas content
      const effectiveScale = commonScaleToFit;
      ctx.scale(effectiveScale, effectiveScale);

      // Draw the current path
      if (currentPath.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.strokeStyle = drawingTools.strokeColor;
        // Adjust line width based on effective scale and zoom
        ctx.lineWidth = Math.max(1, drawingTools.lineWidth / effectiveScale / zoomLevel);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      ctx.restore();
      // --- End User Drawn Path Preview Logic ---

    } else {
      // --- Simple Stroke Preview Logic ---
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Calculate preview line length relative to canvas size, but capped
      const previewLength = Math.min(canvas.width * 0.6, canvas.height * 0.6, 80); // Max length 80px

      ctx.beginPath();
      ctx.moveTo(centerX - previewLength / 2, centerY);
      ctx.lineTo(centerX + previewLength / 2, centerY);
      ctx.strokeStyle = drawingTools.strokeColor;
      // Scale line width slightly for preview, ensuring it's visible but not huge
      ctx.lineWidth = Math.max(1, Math.min(drawingTools.lineWidth, 15)); // Cap max preview width
      ctx.lineCap = 'round';
      ctx.stroke();
      // --- End Simple Stroke Preview Logic ---
    }

  }, [currentPath, drawingTools, theme, systemTheme, panOffset, zoomLevel, previewDimensions, mainCanvasDimensions, previewMode]); // Add previewMode dependency

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn') return; // Only allow panning in userDrawn mode
    setIsPanning(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn' || !isPanning || !lastMousePosition) return;
    const dx = event.clientX - lastMousePosition.x;
    const dy = event.clientY - lastMousePosition.y;
    setPanOffset(prev => ({
      x: prev.x + dx / zoomLevel,
      y: prev.y + dy / zoomLevel,
    }));
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUpOrLeave = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn') return;
    setIsPanning(false);
    setLastMousePosition(null);
    event.currentTarget.style.cursor = 'grab';
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn') return; // Only allow zooming in userDrawn mode
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleAmount = 1.1;
    const newZoomLevelNoClamp = event.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10));

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const panXChange = (mouseX - previewDimensions.width / 2) * (1 / zoomLevel - 1 / newZoomLevel);
    const panYChange = (mouseY - previewDimensions.height / 2) * (1 / zoomLevel - 1 / newZoomLevel);

    setPanOffset(prev => ({
        x: prev.x + panXChange,
        y: prev.y + panYChange,
    }));
    setZoomLevel(newZoomLevel);
  };

  // Determine cursor style based on mode
  const cursorStyle = previewMode === 'userDrawn'
    ? (isPanning ? 'grabbing' : 'grab')
    : 'default';

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
