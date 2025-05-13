
"use client";

import type { Point, Path, CanvasImage, ShapeType } from "@/types/drawing";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { SymmetryControl } from '@/components/controls/SymmetrySettings';
import { AnimationControl } from '@/components/controls/AnimationSettings';
import { DrawingToolControl } from '@/components/controls/DrawingTools';
import { ShapeControl } from '@/components/controls/ShapeSettings';
import { ActionToolbar } from '@/components/controls/ActionToolbar';
import { PreviewCanvas } from '@/components/canvas/PreviewCanvas';
import { ImageUploadControl } from '@/components/controls/ImageUploadControl';

import { Sidebar, SidebarInset, SidebarProvider, SidebarContent } from '@/components/ui/sidebar';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from '@/components/theme-toggle';
import { HegArtLogo } from '@/components/icons/HegArtLogo';
import { Button } from '@/components/ui/button';
import { Menu, Pin, PinOff, Shapes as ShapesIcon, Palette as PaletteIcon, Image as ImageIcon, Wand2 as SymmetryIcon, Zap as AnimationIcon, SlidersHorizontal, Presentation as PreviewIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


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

type ActiveSectionType = 'preview' | 'actions' | 'shapes' | 'tools' | 'image' | 'symmetry' | 'animation';

const initialSymmetrySettings: SymmetrySettings = { mirrorX: false, mirrorY: false, rotationalAxes: 1 };
const initialAnimationSettings: AnimationSettings = {
  isPulsing: false, pulseSpeed: 5, pulseIntensity: 4,
  isScaling: false, scaleSpeed: 2, scaleIntensity: 0.1,
  isSpinning: false, spinSpeed: 30, spinDirectionChangeFrequency: 5,
};
const initialDrawingToolsBase: Omit<DrawingTools, 'strokeColor' | 'backgroundColor'> = { lineWidth: 5 };
const initialShapeSettings: ShapeSettings = { currentShape: 'freehand' };


export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [pathHistory, setPathHistory] = useState<Path[][]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [symmetry, setSymmetry] = useState<SymmetrySettings>(initialSymmetrySettings);
  const [animation, setAnimation] = useState<AnimationSettings>(initialAnimationSettings);
  const [tools, setTools] = useState<DrawingTools>(() => {
    const isSystemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSectionType>('shapes');
  
  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainCanvasDimensions, setMainCanvasDimensions] = useState({ width: 800, height: 600 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const isMobile = useIsMobile();

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
     setSelectedImageId(null); // Deselect image when drawing
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
          setSelectedImageId(newImage.id); // Auto-select new image
          toast({ title: "Image Added", description: "The image has been added to the canvas. Click and drag to move." });
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

  const handleImageUpdate = useCallback((updatedImage: CanvasImage) => {
    setImages(prevImages => prevImages.map(img => img.id === updatedImage.id ? updatedImage : img));
  }, []);

  const handleImageSelect = useCallback((id: string | null) => {
    setSelectedImageId(id);
  }, []);


  const handleClearCanvas = useCallback(() => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths([]);
     setCurrentPath([]);
     setImages([]);
     setSelectedImageId(null);
     toast({ title: "Canvas Cleared", description: "Drawing and images have been cleared." });
  }, [paths, toast]);

  const handleUndo = useCallback(() => {
    if (images.length > 0 && selectedImageId) { // Simplistic undo for last image placement if an image is selected
        const lastImage = images[images.length -1];
        if(lastImage.id === selectedImageId){
             setImages(prev => prev.slice(0, -1));
             setSelectedImageId(null);
             toast({ title: "Image Removed", description: "Last added image was removed."});
             return;
        }
    }
    if (pathHistory.length === 0) return;
    const previousPaths = pathHistory[pathHistory.length - 1];
    setPaths(previousPaths);
    setPathHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentPath([]);
    setSelectedImageId(null);
  }, [pathHistory, images, selectedImageId, toast]);

  const canUndo = pathHistory.length > 0 || (images.length > 0 && selectedImageId !== null && images[images.length-1]?.id === selectedImageId) ;


  const handleSaveDrawing = useCallback(async () => {
    setSelectedImageId(null); // Deselect image before saving
    await new Promise(resolve => setTimeout(resolve, 50)); // Give canvas time to re-render without selection box

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
            // Apply symmetry for images during save
            const numAxes = symmetry.rotationalAxes > 0 ? symmetry.rotationalAxes : 1;
            const canvasCenterX = tempCanvas.width / 2;
            const canvasCenterY = tempCanvas.height / 2;

            for (let i = 0; i < numAxes; i++) {
                const rotationAngle = (i * 2 * Math.PI) / numAxes;
                const applyTransformAndDraw = (currentX: number, currentY: number, currentWidth: number, currentHeight: number, scaleX: number = 1, scaleY: number = 1) => {
                    tempCtx.save();
                    tempCtx.translate(canvasCenterX, canvasCenterY);
                    tempCtx.rotate(rotationAngle);
                    tempCtx.translate(-canvasCenterX, -canvasCenterY);

                    tempCtx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
                    tempCtx.scale(scaleX, scaleY);
                    tempCtx.drawImage(img, -currentWidth / 2, -currentHeight / 2, currentWidth, currentHeight);
                    tempCtx.restore();
                };
                applyTransformAndDraw(imgData.x, imgData.y, imgData.width, imgData.height);
                if (symmetry.mirrorX) {
                    applyTransformAndDraw(tempCanvas.width - imgData.x - imgData.width, imgData.y, imgData.width, imgData.height, -1, 1);
                }
                if (symmetry.mirrorY) {
                    applyTransformAndDraw(imgData.x, tempCanvas.height - imgData.y - imgData.height, imgData.width, imgData.height, 1, -1);
                }
                if (symmetry.mirrorX && symmetry.mirrorY) {
                    applyTransformAndDraw(tempCanvas.width - imgData.x - imgData.width, tempCanvas.height - imgData.y - imgData.height, imgData.width, imgData.height, -1, -1);
                }
            }
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
    handleClearCanvas(); 
    setPathHistory([]); 
    setSelectedImageId(null);
    toast({ title: "Settings Reset", description: "All settings and canvas cleared." });
  }, [theme, systemTheme, handleClearCanvas, toast]);

  const handleStartRecording = useCallback(() => {
    setSelectedImageId(null); // Deselect image before recording
    if (!canvasRef.current) {
      toast({ variant: "destructive", title: "Recording Error", description: "Canvas not available." });
      return;
    }
    try {
      const stream = canvasRef.current.captureStream(30); 
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
      toast({ title: "Recording Stopped", description: "Processing video..." });
    }
  }, [isRecording, toast]);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const toggleSidebarPin = () => setIsSidebarPinned(!isSidebarPinned);

  const handleSectionSelect = (section: ActiveSectionType) => {
    setActiveSection(section);
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    } else if (!isSidebarPinned) {
      setIsSidebarPinned(true); // Auto-expand sidebar if it was collapsed (icon mode)
    }
  };
  
  const headerSections: { name: ActiveSectionType; label: string; icon: React.ElementType }[] = [
    { name: 'preview', label: 'Preview', icon: PreviewIcon },
    { name: 'actions', label: 'Actions', icon: SlidersHorizontal },
    { name: 'shapes', label: 'Shapes', icon: ShapesIcon },
    { name: 'tools', label: 'Drawing Tools', icon: PaletteIcon },
    { name: 'image', label: 'Image Controls', icon: ImageIcon },
    { name: 'symmetry', label: 'Symmetry', icon: SymmetryIcon },
    { name: 'animation', label: 'Animation', icon: AnimationIcon },
  ];

  const renderActiveSectionContent = () => {
    const commonProps = { mainCanvasDimensions };
    switch (activeSection) {
      case 'preview':
        return <PreviewCanvas completedPaths={paths} drawingTools={tools} mainCanvasDimensions={mainCanvasDimensions} />;
      case 'actions':
        return <ActionToolbar onClear={handleClearCanvas} onSave={handleSaveDrawing} onUndo={handleUndo} canUndo={canUndo} onResetSettings={handleResetSettings} isRecording={isRecording} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} />;
      case 'shapes':
        return <ShapeControl shapes={shapeSettings} onShapesChange={setShapeSettings} />;
      case 'tools':
        return <DrawingToolControl tools={tools} onToolsChange={setTools} />;
      case 'image':
        return <ImageUploadControl onImageUpload={handleImageUpload} {...commonProps} />;
      case 'symmetry':
        return <SymmetryControl symmetry={symmetry} onSymmetryChange={setSymmetry} />;
      case 'animation':
        return <AnimationControl animation={animation} onAnimationChange={setAnimation} />;
      default:
        return <div className="p-4 text-muted-foreground">Select a section from the header.</div>;
    }
  };

  const sidebarOpenState = isMobile ? isMobileSidebarOpen : isSidebarPinned;
  const sidebarOnOpenChange = isMobile ? setIsMobileSidebarOpen : setIsSidebarPinned;

  return (
    <SidebarProvider defaultOpen={true}>
       <TooltipProvider>
      <div className="flex h-screen w-full flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4 gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <HegArtLogo className="h-8 w-auto hidden sm:block" />
             <h1 className="font-montserrat text-xl font-bold uppercase tracking-wider hidden lg:block ml-2">#HegArt</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {headerSections.map(section => (
              <Tooltip key={section.name}>
                <TooltipTrigger asChild>
                  <Button variant={activeSection === section.name ? "secondary" : "ghost"} size="icon" onClick={() => handleSectionSelect(section.name)}>
                    <section.icon className="h-5 w-5" />
                    <span className="sr-only">{section.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{section.label}</p></TooltipContent>
              </Tooltip>
            ))}
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleSidebarPin} className="hidden md:inline-flex">
                  {isSidebarPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                  <span className="sr-only">{isSidebarPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{isSidebarPinned ? 'Unpin Sidebar' : 'Pin Sidebar'}</p></TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            className="border-r md:w-80 lg:w-96 z-10"
            collapsible={isMobile ? "none" : "icon"} // Icon collapse only on desktop
            open={sidebarOpenState}
            onOpenChange={sidebarOnOpenChange}
            side="left"
          >
            <ScrollArea className="h-full">
              <SidebarContent className="p-0"> {/* Remove padding if children handle it */}
                 <div className="p-4 space-y-4"> {/* Add padding inside ScrollArea's child */}
                  {renderActiveSectionContent()}
                 </div>
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto p-0">
             <div className="relative w-full h-full overflow-hidden">
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
                  selectedImageId={selectedImageId}
                  onImageSelect={handleImageSelect}
                  onImageUpdate={handleImageUpdate}
                />
             </div>
          </SidebarInset>
        </div>
      </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}

