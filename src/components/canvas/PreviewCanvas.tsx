
"use client";

import type { Point } from "@/types/drawing";
import type { DrawingTools } from "@/components/AppClient";
import React, { useRef, useEffect } from 'react';
import { useTheme } from "next-themes"; // Import useTheme to get background color

interface PreviewCanvasProps {
  currentPath: Point[];
  drawingTools: DrawingTools;
}

export const PreviewCanvas = ({ currentPath, drawingTools }: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine background color based on theme
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    const backgroundColor = isDarkMode ? '#121212' : '#FAFAFA'; // Use theme backgrounds

    // Clear canvas with the determined background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the current path directly if it has points
    if (currentPath.length >= 1) { // Need at least one point to start drawing
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }

      // Use stroke color and line width from drawing tools
      ctx.strokeStyle = drawingTools.strokeColor;
      ctx.lineWidth = Math.max(1, drawingTools.lineWidth); // Ensure minimum line width of 1
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

  }, [currentPath, drawingTools, theme, systemTheme]); // Rerun when path, tools, or theme changes

  // Effect for handling resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver(() => {
        // Set canvas intrinsic size to match its display size
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        // Trigger a redraw manually after resize
         const ctx = canvas.getContext('2d');
         if (!ctx) return;
         const currentTheme = theme === 'system' ? systemTheme : theme;
         const isDarkMode = currentTheme === 'dark';
         const backgroundColor = isDarkMode ? '#121212' : '#FAFAFA';
         ctx.fillStyle = backgroundColor;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         if (currentPath.length >= 1) {
           ctx.beginPath();
           ctx.moveTo(currentPath[0].x, currentPath[0].y);
           for (let i = 1; i < currentPath.length; i++) {
             ctx.lineTo(currentPath[i].x, currentPath[i].y);
           }
           ctx.strokeStyle = drawingTools.strokeColor;
           ctx.lineWidth = Math.max(1, drawingTools.lineWidth);
           ctx.lineCap = 'round';
           ctx.lineJoin = 'round';
           ctx.stroke();
         }
    });
    resizeObserver.observe(parent);

    // Initial size setup
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Cleanup
    return () => {
      resizeObserver.unobserve(parent);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, systemTheme, drawingTools]); // Depend on theme and tools for redraw on resize

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full block" // Ensure canvas fills the container
      data-ai-hint="line drawing"
    />
  );
};
