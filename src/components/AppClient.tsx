
"use client";

import type { Point, Path, CanvasImage } from "@/types/drawing";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { HegArtLogo } from '@/components/icons/HegArtLogo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";

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

export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [pathHistory, setPathHistory] = useState<Path[][]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  // imageHistory could be used for undoing image additions if implemented later
  // const [imageHistory, setImageHistory] = useState<CanvasImage[][]>([]);

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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainCanvasDimensions, setMainCanvasDimensions] = useState({ width: 800, height: 600 });

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
      const parentElement = canvas.parentElement;
      if (!parentElement) return;

      const observer = new ResizeObserver(() => {
        if (parentElement.clientWidth > 0 && parentElement.clientHeight > 0) {
            setMainCanvasDimensions({ width: parentElement.clientWidth, height: parentElement.clientHeight });
        }
      });
       if (parentElement.clientWidth > 0 && parentElement.clientHeight > 0) {
          setMainCanvasDimensions({ width: parentElement.clientWidth, height: parentElement.clientHeight });
       }
      observer.observe(parentElement);
      return () => observer.disconnect();
    }
  }, []);


  const handlePathAdd = useCallback((newPath: Path) => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths((prevPaths) => [...prevPaths, newPath]);
     setCurrentPath([]);
  }, [paths]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          const canvasWidth = mainCanvasDimensions.width || 800; // Fallback if dimensions not ready
          const canvasHeight = mainCanvasDimensions.height || 600;
          
          // Scale image to fit within 30% of the smallest canvas dimension, or max 300px
          const maxDimPercentage = Math.min(canvasWidth, canvasHeight) * 0.3;
          const maxDimAbsolute = 300;
          const maxDim = Math.min(maxDimPercentage, maxDimAbsolute);

          let w = img.naturalWidth;
          let h = img.naturalHeight;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = (h / w) * maxDim;
              w = maxDim;
            } else {
              w = (w / h) * maxDim;
              h = maxDim;
            }
          }
          
          w = Math.min(w, canvasWidth * 0.9); // Ensure it's not too large for canvas
          h = Math.min(h, canvasHeight * 0.9);

          const newImage: CanvasImage = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            src: dataUrl,
            x: (canvasWidth - w) / 2,
            y: (canvasHeight - h) / 2,
            width: w,
            height: h,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
          };
          // setImageHistory(prev => [...prev, images]); // For undo, if implemented
          setImages(prev => [...prev, newImage]);
          toast({ title: "Image Added", description: "The image has been added to the canvas." });
        };
        img.onerror = () => {
          toast({ variant: "destructive", title: "Error", description: "Could not load image file." });
        };
        img.src = dataUrl;
      }
    };
    reader.onerror = () => {
       toast({ variant: "destructive", title: "Error", description: "Could not read image file." });
    };
    reader.readAsDataURL(file);
  }, [mainCanvasDimensions, toast]); // Removed images from deps to avoid issues with setImageHistory

  const handleClearCanvas = useCallback(() => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths([]);
     setCurrentPath([]);
     // setImageHistory(prev => [...prev, images]); // For undo, if implemented
     setImages([]);
     toast({ title: "Canvas Cleared", description: "Drawing and images have been cleared." });
  }, [paths, toast]); // Removed images from deps

  const handleUndo = useCallback(() => {
    if (pathHistory.length === 0) return;
    const previousPaths = pathHistory[pathHistory.length - 1];
    setPaths(previousPaths);
    setPathHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentPath([]);
    // Note: Image undo is not implemented in this pass.
  }, [pathHistory]);

  const canUndo = pathHistory.length > 0;

  const handleSaveDrawing = useCallback(async () => {
    if (canvasRef.current) {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        toast({ variant: "destructive", title: "Error", description: "Could not create save context." });
        return;
      }

      const saveWidth = Math.max(1, mainCanvasDimensions.width);
      const saveHeight = Math.max(1, mainCanvasDimensions.height);
      tempCanvas.width = saveWidth;
      tempCanvas.height = saveHeight;

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

      // Draw images (simplified for save: no live symmetry/animation effects from DrawingCanvas)
      const imageLoadPromises = images.map(imgData => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            // Draw image at its stored position and size
            tempCtx.drawImage(img, imgData.x, imgData.y, imgData.width, imgData.height);
            resolve();
          };
          img.onerror = (err) => {
            console.error("Error loading image for save:", imgData.src, err);
            // Resolve even on error to not block saving other elements, or reject if all must succeed
            resolve(); 
          };
          img.src = imgData.src;
        });
      });

      try {
        await Promise.all(imageLoadPromises);
        const imageURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'hegart-drawing.png';
        link.href = imageURL;
        link.click();
        toast({ title: "Drawing Saved", description: "Image exported as PNG." });
      } catch (error) {
        console.error("Could not save drawing due to image loading error:", error);
        toast({ variant: "destructive", title: "Save Error", description: "Failed to process images for saving." });
      }
    }
  }, [canvasRef, paths, images, tools.backgroundColor, symmetry, mainCanvasDimensions, toast]);


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
              activePath={currentPath}
              completedPaths={paths}
              onClear={handleClearCanvas}
              onSave={handleSaveDrawing}
              onUndo={handleUndo}
              canUndo={canUndo}
              mainCanvasDimensions={mainCanvasDimensions}
              onImageUpload={handleImageUpload} // Pass image upload handler
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto p-0">
             <div className="relative w-full h-full overflow-hidden">
                <DrawingCanvas
                  ref={canvasRef}
                  paths={paths}
                  images={images} // Pass images
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
