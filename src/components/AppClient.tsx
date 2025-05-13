
"use client";

import type { Point, Path, CanvasImage, ShapeType } from "@/types/drawing";
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
  pulseIntensity: number; 
  isScaling: boolean;
  scaleSpeed: number;
  scaleIntensity: number; 
  isSpinning: boolean;
  spinSpeed: number; 
  spinDirectionChangeFrequency: number; 
}

export interface DrawingTools {
  strokeColor: string;
  lineWidth: number;
  backgroundColor: string;
}

export interface ShapeSettings {
  currentShape: ShapeType;
}

const initialSymmetrySettings: SymmetrySettings = { mirrorX: false, mirrorY: false, rotationalAxes: 1 };
const initialAnimationSettings: AnimationSettings = {
  isPulsing: false, pulseSpeed: 5, pulseIntensity: 4,
  isScaling: false, scaleSpeed: 2, scaleIntensity: 0.1,
  isSpinning: false, spinSpeed: 30, spinDirectionChangeFrequency: 5,
};
// Initial tool colors will be set by theme effect
const initialDrawingToolsBase: Omit<DrawingTools, 'strokeColor' | 'backgroundColor'> = { lineWidth: 5 };
const initialShapeSettings: ShapeSettings = { currentShape: 'freehand' };


export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [pathHistory, setPathHistory] = useState<Path[][]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);

  const [symmetry, setSymmetry] = useState<SymmetrySettings>(initialSymmetrySettings);
  const [animation, setAnimation] = useState<AnimationSettings>(initialAnimationSettings);
  const [tools, setTools] = useState<DrawingTools>(() => {
    // Initialize with theme-dependent colors
    const isSystemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Assume default theme is light if not system or if window is undefined initially
    const defaultIsDark = false; 
    const isDarkMode = isSystemDark || defaultIsDark; 
    return {
      ...initialDrawingToolsBase,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    };
  });
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>(initialShapeSettings);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainCanvasDimensions, setMainCanvasDimensions] = useState({ width: 800, height: 600 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

   useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentTheme === 'dark';
    setTools(prev => ({
      ...prev, // Keep other settings like lineWidth
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
          const canvasWidth = mainCanvasDimensions.width || 800;
          const canvasHeight = mainCanvasDimensions.height || 600;
          
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
          
          w = Math.min(w, canvasWidth * 0.9);
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
  }, [mainCanvasDimensions, toast]);

  const handleClearCanvas = useCallback(() => {
     setPathHistory((prevHistory) => [...prevHistory, paths]); // Save current state for potential undo
     setPaths([]);
     setCurrentPath([]);
     setImages([]);
     toast({ title: "Canvas Cleared", description: "Drawing and images have been cleared." });
  }, [paths, toast]);

  const handleUndo = useCallback(() => {
    if (pathHistory.length === 0) return;
    const previousPaths = pathHistory[pathHistory.length - 1];
    setPaths(previousPaths);
    setPathHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentPath([]);
    // Note: Image undo is not fully implemented with path history (would need separate image history)
    // For simplicity, undo only affects paths for now.
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

      const imageLoadPromises = images.map(imgData => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            tempCtx.drawImage(img, imgData.x, imgData.y, imgData.width, imgData.height);
            resolve();
          };
          img.onerror = (err) => {
            console.error("Error loading image for save:", imgData.src, err);
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

  const handleResetSettings = useCallback(() => {
    setSymmetry(initialSymmetrySettings);
    setAnimation(initialAnimationSettings);
    
    const currentThemeResolved = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentThemeResolved === 'dark';
    setTools({
      ...initialDrawingToolsBase,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    });
    setShapeSettings(initialShapeSettings);
    handleClearCanvas(); // Also clear canvas content on full reset
    setPathHistory([]); // Clear undo history too
    toast({ title: "Settings Reset", description: "All settings and canvas cleared." });
  }, [theme, systemTheme, handleClearCanvas]);

  const handleStartRecording = useCallback(() => {
    if (!canvasRef.current) {
      toast({ variant: "destructive", title: "Recording Error", description: "Canvas not available." });
      return;
    }
    try {
      const stream = canvasRef.current.captureStream(30); // 30 FPS
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hegart-recording.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast({ title: "Recording Saved", description: "Video saved as hegart-recording.webm." });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Canvas recording has begun." });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({ variant: "destructive", title: "Recording Error", description: `Could not start recording: ${error instanceof Error ? error.message : "Unknown error"}` });
      setIsRecording(false);
    }
  }, [toast]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // onstop will handle the rest
      toast({ title: "Recording Stopped", description: "Processing video..." });
    }
  }, [isRecording, toast]);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
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
            className="border-r md:w-80 lg:w-96 z-10" // Ensure sidebar is above maximized preview if it overflows
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
              onResetSettings={handleResetSettings}
              mainCanvasDimensions={mainCanvasDimensions}
              onImageUpload={handleImageUpload}
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto p-0">
             <div className="relative w-full h-full overflow-hidden"> {/* This overflow-hidden might conflict with maximized preview, ensure preview is truly fixed/portaled if it breaks out */}
                <DrawingCanvas
                  ref={canvasRef}
                  paths={paths}
                  images={images}
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
