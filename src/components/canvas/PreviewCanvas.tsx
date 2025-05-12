
"use client";

import type { Point, Path } from "@/types/drawing";
import type { DrawingTools, PreviewMode } from "@/components/AppClient";
import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from "next-themes";

interface PreviewCanvasProps {
  activePath: Point[]; // The path currently being drawn by the user
  completedPaths: Path[]; // All paths already added to the main canvas
  drawingTools: DrawingTools;
  mainCanvasDimensions: { width: number; height: number }; // Dimensions of the main canvas for scaling in 'userDrawn'
  previewMode: PreviewMode;
}

export const PreviewCanvas = ({
  activePath,
  completedPaths,
  drawingTools,
  mainCanvasDimensions,
  previewMode
}: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, systemTheme } = useTheme();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 160, height: 90 }); // Default, will be updated

  // Reset pan/zoom when switching modes or when not in userDrawn mode
  useEffect(() => {
    if (previewMode !== 'userDrawn') {
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

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (previewMode === 'userDrawn') {
      // --- User Drawn Path Preview Logic (all completedPaths) ---
      if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) return;

      ctx.save();
      ctx.translate(previewDimensions.width / 2, previewDimensions.height / 2);
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(panOffset.x, panOffset.y);
      // The translation to -previewDimensions.width / (2 * zoomLevel) is to counteract the initial translate to center.
      // This ensures that (0,0) of the content is at the top-left before scaling.
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

    } else { // previewMode === 'stroke'
      // --- Stroke Preview Logic (activePath or generic tool line) ---
      // No pan/zoom for this mode.
      if (activePath.length >= 1) {
        const pathPoints = activePath;
        const bounds = pathPoints.reduce((acc, p) => ({
          minX: Math.min(acc.minX, p.x),
          maxX: Math.max(acc.maxX, p.x),
          minY: Math.min(acc.minY, p.y),
          maxY: Math.max(acc.maxY, p.y),
        }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

        const pathActualWidth = bounds.maxX - bounds.minX;
        const pathActualHeight = bounds.maxY - bounds.minY;

        if (pathPoints.length === 1 || pathActualWidth > 0 || pathActualHeight > 0) {
            const previewPaddingFactor = 0.2; // 20% padding around the stroke
            const targetWidth = canvas.width * (1 - previewPaddingFactor);
            const targetHeight = canvas.height * (1 - previewPaddingFactor);

            let scale = 1;
            if (pathActualWidth > 0 || pathActualHeight > 0) {
                 const scaleToFitPathX = pathActualWidth > 0 ? targetWidth / pathActualWidth : Infinity;
                 const scaleToFitPathY = pathActualHeight > 0 ? targetHeight / pathActualHeight : Infinity;
                 scale = Math.min(scaleToFitPathX, scaleToFitPathY, 2); // Cap max scale (e.g., 2x)
            }


            const scaledPathWidth = pathActualWidth * scale;
            const scaledPathHeight = pathActualHeight * scale;

            const offsetX = (canvas.width - scaledPathWidth) / 2 - bounds.minX * scale;
            const offsetY = (canvas.height - scaledPathHeight) / 2 - bounds.minY * scale;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 1; i < pathPoints.length; i++) {
                ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
            }
            ctx.strokeStyle = drawingTools.strokeColor;
            ctx.lineWidth = Math.max(1, drawingTools.lineWidth / scale);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.restore();

        } else if (pathPoints.length === 1) { // Should be covered by the above, but as a fallback for a single point.
            ctx.beginPath();
            const radius = Math.max(1, drawingTools.lineWidth / 2);
            ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = drawingTools.strokeColor;
            ctx.fill();
        }
      } else {
        // Generic tool line representation
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const previewLength = Math.min(canvas.width * 0.6, canvas.height * 0.6, 80);
        ctx.beginPath();
        ctx.moveTo(centerX - previewLength / 2, centerY);
        ctx.lineTo(centerX + previewLength / 2, centerY);
        ctx.strokeStyle = drawingTools.strokeColor;
        ctx.lineWidth = Math.max(1, Math.min(drawingTools.lineWidth, 15));
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

  }, [activePath, completedPaths, drawingTools, theme, systemTheme, panOffset, zoomLevel, previewDimensions, mainCanvasDimensions, previewMode]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn') return;
    setIsPanning(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (previewMode !== 'userDrawn' || !isPanning || !lastMousePosition) return;
    const dx = event.clientX - lastMousePosition.x;
    const dy = event.clientY - lastMousePosition.y;
    setPanOffset(prev => ({
      x: prev.x + dx / zoomLevel, // Panning is inversely affected by zoom
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
    if (previewMode !== 'userDrawn') return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scaleAmount = 1.1;
    const newZoomLevelNoClamp = event.deltaY < 0 ? zoomLevel * scaleAmount : zoomLevel / scaleAmount;
    const newZoomLevel = Math.max(0.1, Math.min(newZoomLevelNoClamp, 10)); // Clamp zoom

    const rect = canvas.getBoundingClientRect();
    // Mouse position relative to canvas element
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate the change in pan offset to keep the point under the mouse stationary
    // World point before zoom: (mouseX - pan.x * zoom - canvas.width/2) / zoom
    // World point after zoom: (mouseX - pan'.x * newZoom - canvas.width/2) / newZoom
    // Setting them equal and solving for pan'.x doesn't directly give the offset.
    // A simpler way: find where the mouse points in the *unzoomed, unpanned* content space,
    // then adjust pan so that this point remains under the mouse after zoom.

    // Point on canvas before zoom: (worldX * zoom + panX) + previewCenter.x
    // MouseX = (worldX * zoom + panX) + previewCenter.x
    // worldX = (MouseX - previewCenter.x - panX) / zoom
    // We want worldX to be the same after zoom:
    // worldX = (MouseX - previewCenter.x - newPanX) / newZoom
    // (MouseX - previewCenter.x - panX) / zoom = (MouseX - previewCenter.x - newPanX) / newZoom
    // Let P = MouseX - previewCenter.x
    // (P - panX) / zoom = (P - newPanX) / newZoom
    // newPanX = P - (P - panX) * newZoom / zoom
    const previewCenterX = previewDimensions.width / 2;
    const previewCenterY = previewDimensions.height / 2;

    const newPanX = mouseX - previewCenterX - (mouseX - previewCenterX - panOffset.x) * (newZoomLevel / zoomLevel);
    const newPanY = mouseY - previewCenterY - (mouseY - previewCenterY - panOffset.y) * (newZoomLevel / zoomLevel);


    setPanOffset({x: newPanX, y: newPanY});
    setZoomLevel(newZoomLevel);
  };

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
