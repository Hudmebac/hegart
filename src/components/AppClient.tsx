
"use client";

import type { Point, Path } from "@/types/drawing";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { HegArtLogo } from '@/components/icons/HegArtLogo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useTheme } from 'next-themes';

export interface SymmetrySettings {
  mirrorX: boolean;
  mirrorY: boolean;
  rotationalAxes: number;
}

export interface AnimationSettings {
  isPulsing: boolean;
  pulseSpeed: number;
  pulseIntensity: number; // Controls line width variation range
  isScaling: boolean;
  scaleSpeed: number;
  scaleIntensity: number; // 0 to 1, max scale change percentage
  isSpinning: boolean;
  spinSpeed: number; // Degrees per second
  spinDirectionChangeFrequency: number; // How often (in seconds) direction might change
}

export interface DrawingTools {
  strokeColor: string;
  lineWidth: number;
  backgroundColor: string;
}

export interface ShapeSettings {
  currentShape: 'freehand' | 'triangle' | 'square' | 'circle' | 'pentagon';
}

export type PreviewMode = 'stroke' | 'userDrawn';

export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [pathHistory, setPathHistory] = useState<Path[][]>([]);
  const [symmetry, setSymmetry] = useState<SymmetrySettings>({
    mirrorX: false,
    mirrorY: false,
    rotationalAxes: 1,
  });
  const [animation, setAnimation] = useState<AnimationSettings>({
    isPulsing: false,
    pulseSpeed: 5,
    pulseIntensity: 4,
    isScaling: false,
    scaleSpeed: 2,
    scaleIntensity: 0.1,
    isSpinning: false,
    spinSpeed: 30,
    spinDirectionChangeFrequency: 5,
  });
  const [tools, setTools] = useState<DrawingTools>({
    strokeColor: '#000000',
    lineWidth: 5,
    backgroundColor: '#FAFAFA',
  });
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>({
    currentShape: 'freehand',
  });
  const [previewMode, setPreviewMode] = useState<PreviewMode>('userDrawn'); // New state for preview mode

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainCanvasDimensions, setMainCanvasDimensions] = useState({ width: 800, height: 600 }); // Default values

   useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    setTools(prev => ({
      ...prev,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    }));
  }, [theme, systemTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const observer = new ResizeObserver(() => {
        // Ensure width/height are positive before setting
        if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
            setMainCanvasDimensions({ width: canvas.clientWidth, height: canvas.clientHeight });
        }
      });
       // Use clientWidth/clientHeight for responsive size
       if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
          setMainCanvasDimensions({ width: canvas.clientWidth, height: canvas.clientHeight });
       }
      observer.observe(canvas.parentElement!); // Observe parent for size changes
      return () => observer.disconnect();
    }
  }, []);


  const handlePathAdd = useCallback((newPath: Path) => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths((prevPaths) => [...prevPaths, newPath]);
     setCurrentPath([]);
  }, [paths]);

  const handleClearCanvas = useCallback(() => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths([]);
     setCurrentPath([]);
  }, [paths]);

  const handleUndo = useCallback(() => {
    if (pathHistory.length === 0) return;
    const previousPaths = pathHistory[pathHistory.length - 1];
    setPaths(previousPaths);
    setPathHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentPath([]);
  }, [pathHistory]);

  const canUndo = pathHistory.length > 0;

  const handleSaveDrawing = useCallback(() => {
    if (canvasRef.current) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const mainCanvas = canvasRef.current;

      if (!tempCtx) return;

      // Use calculated dimensions for saving to match display
      tempCanvas.width = mainCanvasDimensions.width;
      tempCanvas.height = mainCanvasDimensions.height;


      tempCtx.fillStyle = tools.backgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

       const drawStaticPath = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number) => {
          if (path.length < 2) return;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
      };

      const drawStaticSymmetricPath = (originalPath: Path) => {
        const ctx = tempCtx;
        const canvas = tempCanvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const numAxes = symmetry.rotationalAxes > 0 ? symmetry.rotationalAxes : 1;

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


          const baseTransformedPath = originalPath.points.map(transformPoint);
          drawStaticPath(ctx, baseTransformedPath, originalPath.color, originalPath.lineWidth);

          if (symmetry.mirrorX) {
            const mirroredXPath = originalPath.points.map(p => ({x: canvas.width - p.x, y: p.y})).map(transformPoint);
            drawStaticPath(ctx, mirroredXPath, originalPath.color, originalPath.lineWidth);
          }
          if (symmetry.mirrorY) {
             const mirroredYPath = originalPath.points.map(p => ({x: p.x, y: canvas.height - p.y})).map(transformPoint);
             drawStaticPath(ctx, mirroredYPath, originalPath.color, originalPath.lineWidth);
          }
          if (symmetry.mirrorX && symmetry.mirrorY) {
              const mirroredXYPath = originalPath.points.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y})).map(transformPoint);
              drawStaticPath(ctx, mirroredXYPath, originalPath.color, originalPath.lineWidth);
          }
        }
      };

      paths.forEach(path => drawStaticSymmetricPath(path));


      const image = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'hegart-drawing.png';
      link.href = image;
      link.click();
    }
  }, [canvasRef, paths, tools.backgroundColor, symmetry, mainCanvasDimensions]);


  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <HegArtLogo className="h-8 w-auto" />
            <h1 className="font-montserrat text-xl font-bold uppercase tracking-wider hidden sm:block">#HegArt</h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            className="border-r md:w-80 lg:w-96"
            collapsible="icon"
            open={isMobileSidebarOpen}
            onOpenChange={setIsMobileSidebarOpen}
          >
            <ControlPanel
              symmetry={symmetry}
              onSymmetryChange={setSymmetry}
              animation={animation}
              onAnimationChange={setAnimation}
              tools={tools}
              onToolsChange={setTools}
              shapes={shapeSettings}
              onShapesChange={setShapeSettings}
              currentPath={currentPath}
              onClear={handleClearCanvas}
              onSave={handleSaveDrawing}
              onUndo={handleUndo}
              canUndo={canUndo}
              mainCanvasDimensions={mainCanvasDimensions}
              previewMode={previewMode} // Pass preview mode state
              onPreviewModeChange={setPreviewMode} // Pass setter
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto p-0">
             {/* Wrap canvas in a div that allows it to shrink */}
             <div className="relative w-full h-full overflow-hidden">
                <DrawingCanvas
                  ref={canvasRef}
                  paths={paths}
                  currentPath={currentPath}
                  onCurrentPathChange={setCurrentPath}
                  onPathAdd={handlePathAdd}
                  symmetrySettings={symmetry}
                  animationSettings={animation}
                  drawingTools={tools}
                  shapeSettings={shapeSettings}
                  backgroundColor={tools.backgroundColor}
                />
             </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
