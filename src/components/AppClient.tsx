
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
import { Menu, Pin, PinOff, Shapes as ShapesIcon, Palette as PaletteIcon, Image as ImageIcon, Wand2 as SymmetryIcon, Zap as AnimationIcon, SlidersHorizontal, Presentation as PreviewIconLucide, ListCollapse, PaintBucket } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


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
  fillColor: string; 
  lineWidth: number;
  backgroundColor: string;
}

export interface ShapeSettings {
  currentShape: ShapeType;
  isFixedShape: boolean; // New: If true, shape is not subject to symmetry
  excludeFromAnimation: boolean; // New: If true, shape is not animated
}

type ControlSectionId = 'actions' | 'shapes' | 'tools' | 'image' | 'symmetry' | 'animation';
type HeaderControlSelectionId = ControlSectionId | 'all';


const initialSymmetrySettings: SymmetrySettings = { mirrorX: false, mirrorY: false, rotationalAxes: 1 };
const initialAnimationSettings: AnimationSettings = {
  isPulsing: false, pulseSpeed: 5, pulseIntensity: 4,
  isScaling: false, scaleSpeed: 2, scaleIntensity: 0.1,
  isSpinning: false, spinSpeed: 30, spinDirectionChangeFrequency: 5,
};
const initialDrawingToolsBase: Omit<DrawingTools, 'strokeColor' | 'backgroundColor' | 'fillColor'> = { lineWidth: 5 };
const initialShapeSettings: ShapeSettings = { 
  currentShape: 'freehand',
  isFixedShape: false,
  excludeFromAnimation: false,
};


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
      fillColor: isDarkMode ? '#FFFFFF40' : '#00000040', // Default semi-transparent fill
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    };
  });
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>(initialShapeSettings);
  const [isFillModeActive, setIsFillModeActive] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  
  const [activeSections, setActiveSections] = useState<Set<HeaderControlSelectionId>>(() => new Set<HeaderControlSelectionId>(['shapes']));
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  
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
    const defaultFillColor = isDarkMode ? '#FFFFFF40' : '#00000040';
    setTools(prev => ({
      ...prev,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
      fillColor: prev.fillColor === (isDarkMode ? '#00000040' : '#FFFFFF40') || !prev.fillColor ? defaultFillColor : prev.fillColor,
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
     // Augment the path with current shape settings for fixed/animation exclusion
     const augmentedPath: Path = {
      ...newPath,
      isFixedShape: shapeSettings.isFixedShape,
      excludeFromAnimation: shapeSettings.excludeFromAnimation,
    };
     setPaths((prevPaths) => [...prevPaths, augmentedPath]);
     setCurrentPath([]);
     setSelectedImageId(null); 
     // setIsFillModeActive(false); // Optionally turn off fill mode after drawing a shape
  }, [paths, shapeSettings.isFixedShape, shapeSettings.excludeFromAnimation]);

  const handleFillPath = useCallback((pathIndex: number, fillColor: string) => {
    setPathHistory(prev => [...prev, paths]);
    setPaths(prevPaths => prevPaths.map((p, idx) => 
      idx === pathIndex ? { ...p, fillColor } : p
    ));
    toast({ title: "Shape Filled", description: "The selected shape has been filled." });
    // setIsFillModeActive(false); // Optionally keep fill mode active
  }, [paths, toast]);

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
          setSelectedImageId(newImage.id); 
          setIsFillModeActive(false); // Turn off fill mode when uploading image
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
    if (id) setIsFillModeActive(false); // Turn off fill mode if an image is selected
  }, []);


  const handleClearCanvas = useCallback(() => {
     setPathHistory((prevHistory) => [...prevHistory, paths]);
     setPaths([]);
     setCurrentPath([]);
     setImages([]);
     setSelectedImageId(null);
     setIsFillModeActive(false);
     toast({ title: "Canvas Cleared", description: "Drawing and images have been cleared." });
  }, [paths, toast]);

  const handleUndo = useCallback(() => {
    if (pathHistory.length > 0) {
        const previousPaths = pathHistory[pathHistory.length - 1];
        setPaths(previousPaths);
        setPathHistory((prevHistory) => prevHistory.slice(0, -1));
        setCurrentPath([]); 
        setSelectedImageId(null); 
        // setIsFillModeActive(false); // Don't change fill mode on undo
        toast({ title: "Undo Successful", description: "Last drawing or fill action undone." });
        return;
    }

    // Simplified image undo: remove last added if no path history
    // More complex image undo (specific selected image) would need its own history
    if (images.length > 0) { 
        setImages(prev => prev.slice(0, -1));
        setSelectedImageId(null); // Deselect if the removed image was selected
        toast({ title: "Image Removed", description: "Last added image was removed."});
        return;
    }
    toast({ title: "Nothing to Undo", description: "Canvas is empty or at earliest state." });
  }, [pathHistory, paths, images, toast]);
  
  const canUndo = pathHistory.length > 0 || images.length > 0;


  const handleSaveDrawing = useCallback(async () => {
    setSelectedImageId(null); 
    setIsFillModeActive(false);
    await new Promise(resolve => setTimeout(resolve, 50)); 

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

      const drawStaticPath = (ctx: CanvasRenderingContext2D, pathPoints: Point[], strokeColor: string, lineWidth: number, fillColor?: string) => {
          if (pathPoints.length < 1) return;
          ctx.beginPath();
          ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
          }
          
          if (pathPoints.length > 2) { 
            ctx.closePath();
          }

          if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
          }
          
          if (lineWidth > 0) { 
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          }
      };

      const drawStaticSymmetricPathOrFixed = (originalPath: Path) => {
        if (originalPath.isFixedShape) {
          // Draw fixed shape once, without symmetry
          drawStaticPath(tempCtx, originalPath.points, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          return;
        }

        // Existing symmetric drawing logic for non-fixed shapes
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
          drawStaticPath(ctx, baseTransformedPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);

          if (symmetry.mirrorX) {
            const mirroredXPath = originalPath.points.map(p => ({x: canvas.width - p.x, y: p.y})).map(transformPoint);
            drawStaticPath(ctx, mirroredXPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
          if (symmetry.mirrorY) {
             const mirroredYPath = originalPath.points.map(p => ({x: p.x, y: canvas.height - p.y})).map(transformPoint);
             drawStaticPath(ctx, mirroredYPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
          if (symmetry.mirrorX && symmetry.mirrorY) {
              const mirroredXYPath = originalPath.points.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y})).map(transformPoint);
              drawStaticPath(ctx, mirroredXYPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
        }
      };
      paths.forEach(path => drawStaticSymmetricPathOrFixed(path));

      const imageLoadPromises = images.map(imgData => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
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
      fillColor: isDarkMode ? '#FFFFFF40' : '#00000040',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    });
    setShapeSettings(initialShapeSettings); // This will reset isFixedShape and excludeFromAnimation
    handleClearCanvas(); 
    setPathHistory([]); 
    setSelectedImageId(null);
    setIsFillModeActive(false);
    toast({ title: "Settings Reset", description: "All settings and canvas cleared." });
  }, [theme, systemTheme, handleClearCanvas, toast]);

  const handleStartRecording = useCallback(() => {
    setSelectedImageId(null); 
    setIsFillModeActive(false);
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
  
  const toggleSidebarPin = () => {
    const newPinnedState = !isSidebarPinned;
    setIsSidebarPinned(newPinnedState);
    if (newPinnedState) { 
      setIsSidebarHovered(false); 
    }
  };

  const toggleFillMode = useCallback(() => {
    setIsFillModeActive(prev => {
        const nextState = !prev;
        if (nextState) { // Entering fill mode
            setSelectedImageId(null); 
            setCurrentPath([]); 
            toast({ title: "Fill Mode Activated", description: "Click on shapes to fill them.", duration: 2000 });
        } else { // Exiting fill mode
            toast({ title: "Fill Mode Deactivated", description: "Drawing mode re-enabled.", duration: 2000 });
        }
        return nextState;
    });
  }, [toast]);


  const togglePreview = () => setIsPreviewVisible(prev => !prev);

  const handleSectionSelect = (sectionName: HeaderControlSelectionId) => {
    setActiveSections(prev => {
        const newActive = new Set(prev);

        if (sectionName === 'all') {
            if (newActive.has('all')) { 
                newActive.delete('all');
                if (newActive.size === 0) newActive.add('shapes'); 
            } else { 
                newActive.clear();
                newActive.add('all');
            }
        } else { 
            newActive.delete('all'); 

            if (newActive.has(sectionName)) {
                newActive.delete(sectionName as ControlSectionId);
            } else {
                newActive.add(sectionName as ControlSectionId);
            }

            if (newActive.size === 0) { 
                newActive.add('shapes');
            }
        }
        return newActive;
    });

    if (isMobile) {
        setIsMobileSidebarOpen(true);
    } else if (!isSidebarPinned) {
        setIsSidebarHovered(true); 
    }
  };
  
  const controlPanelSections: { name: ControlSectionId; label: string; icon: React.ElementType }[] = [
    { name: 'actions', label: 'Actions', icon: SlidersHorizontal },
    { name: 'shapes', label: 'Shapes', icon: ShapesIcon },
    { name: 'tools', label: 'Drawing Tools', icon: PaletteIcon },
    { name: 'image', label: 'Image Controls', icon: ImageIcon },
    { name: 'symmetry', label: 'Symmetry', icon: SymmetryIcon },
    { name: 'animation', label: 'Animation', icon: AnimationIcon },
  ];

  const allControlsHeaderConfig = { name: 'all' as const, label: 'All Control Sections', icon: ListCollapse };
  const previewHeaderConfig = { name: 'preview' as const, label: 'Toggle Preview', icon: PreviewIconLucide };


  const renderActiveSectionContent = () => {
    const commonProps = { mainCanvasDimensions };
    const controlSectionOrder: ControlSectionId[] = ['actions', 'shapes', 'tools', 'image', 'symmetry', 'animation'];

    if (activeSections.has('all')) {
        return (
            <Accordion type="multiple" className="w-full space-y-1" defaultValue={['shapes']}>
                {controlPanelSections.map(sectionConfig => {
                    let sectionContent: JSX.Element | null = null;
                    switch (sectionConfig.name) {
                        case 'actions':
                            sectionContent = <ActionToolbar onClear={handleClearCanvas} onSave={handleSaveDrawing} onUndo={handleUndo} canUndo={canUndo} onResetSettings={handleResetSettings} isRecording={isRecording} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} isFillModeActive={isFillModeActive} onToggleFillMode={toggleFillMode} />;
                            break;
                        case 'shapes':
                            sectionContent = <ShapeControl shapes={shapeSettings} onShapesChange={setShapeSettings} />;
                            break;
                        case 'tools':
                            sectionContent = <DrawingToolControl tools={tools} onToolsChange={setTools} isFillModeActive={isFillModeActive} onToggleFillMode={toggleFillMode} />;
                            break;
                        case 'image':
                            sectionContent = <ImageUploadControl onImageUpload={handleImageUpload} {...commonProps} />;
                            break;
                        case 'symmetry':
                            sectionContent = <SymmetryControl symmetry={symmetry} onSymmetryChange={setSymmetry} />;
                            break;
                        case 'animation':
                            sectionContent = <AnimationControl animation={animation} onAnimationChange={setAnimation} />;
                            break;
                    }
                    if (!sectionContent) return null;

                    return (
                        <AccordionItem value={sectionConfig.name} key={sectionConfig.name} className="border-b-0 rounded-md border bg-card shadow-sm overflow-hidden">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <sectionConfig.icon className="h-4 w-4 text-muted-foreground" />
                                    {sectionConfig.label}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                {sectionContent}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        );
    }

    if (activeSections.size === 0) {
      return <div className="p-4 text-muted-foreground">Select a control section from the header or "All".</div>;
    }

    const componentsToRender: JSX.Element[] = [];
    for (const sectionName of controlSectionOrder) {
      if (activeSections.has(sectionName)) {
        let sectionContent: JSX.Element | null = null;
        const sectionConfig = controlPanelSections.find(s => s.name === sectionName);
        if (!sectionConfig) continue;

        switch (sectionName) {
          case 'actions':
            sectionContent = <div key="actions" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><ActionToolbar onClear={handleClearCanvas} onSave={handleSaveDrawing} onUndo={handleUndo} canUndo={canUndo} onResetSettings={handleResetSettings} isRecording={isRecording} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} isFillModeActive={isFillModeActive} onToggleFillMode={toggleFillMode}/></div>;
                            break;
          case 'shapes':
            sectionContent = <div key="shapes" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><ShapeControl shapes={shapeSettings} onShapesChange={setShapeSettings} /></div>;
            break;
          case 'tools':
            sectionContent = <div key="tools" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><DrawingToolControl tools={tools} onToolsChange={setTools} isFillModeActive={isFillModeActive} onToggleFillMode={toggleFillMode} /></div>;
            break;
          case 'image':
            sectionContent = <div key="image" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><ImageUploadControl onImageUpload={handleImageUpload} {...commonProps} /></div>;
            break;
          case 'symmetry':
            sectionContent = <div key="symmetry" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><SymmetryControl symmetry={symmetry} onSymmetryChange={setSymmetry} /></div>;
            break;
          case 'animation':
            sectionContent = <div key="animation" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><AnimationControl animation={animation} onAnimationChange={setAnimation} /></div>;
            break;
        }
        if (sectionContent) {
          componentsToRender.push(sectionContent);
        }
      }
    }
    return <div className="space-y-4">{componentsToRender}</div>;
  };

  const sidebarOpenState = isMobile 
    ? isMobileSidebarOpen 
    : (isSidebarPinned || isSidebarHovered);

  const sidebarOnOpenChange = isMobile 
    ? setIsMobileSidebarOpen 
    : (open: boolean) => {
        if (!isMobile) {
          if (open && !isSidebarPinned) { 
            setIsSidebarPinned(true); 
            setIsSidebarHovered(false); 
          } else if (!open && isSidebarPinned) { 
            setIsSidebarPinned(false); 
          }
        }
      };


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
             <Tooltip key={previewHeaderConfig.name}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isPreviewVisible ? "secondary" : "ghost"} 
                    size="icon" 
                    onClick={togglePreview}
                    aria-pressed={isPreviewVisible}
                  >
                    <previewHeaderConfig.icon className="h-5 w-5" />
                    <span className="sr-only">{previewHeaderConfig.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{previewHeaderConfig.label}</p></TooltipContent>
              </Tooltip>
              <Tooltip key={allControlsHeaderConfig.name}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeSections.has(allControlsHeaderConfig.name) ? "secondary" : "ghost"} 
                    size="icon" 
                    onClick={() => handleSectionSelect(allControlsHeaderConfig.name)}
                    aria-pressed={activeSections.has(allControlsHeaderConfig.name)}
                  >
                    <allControlsHeaderConfig.icon className="h-5 w-5" />
                    <span className="sr-only">{allControlsHeaderConfig.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{allControlsHeaderConfig.label}</p></TooltipContent>
              </Tooltip>
            {controlPanelSections.map(section => (
              <Tooltip key={section.name}>
                <TooltipTrigger asChild>
                  <Button 
                    variant={activeSections.has(section.name) ? "secondary" : "ghost"} 
                    size="icon" 
                    onClick={() => handleSectionSelect(section.name)}
                    aria-pressed={activeSections.has(section.name)}
                  >
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
        <div className="flex flex-1 overflow-hidden relative"> 
          <Sidebar
            className="border-r md:w-80 lg:w-96 z-10"
            collapsible={isMobile ? "none" : "icon"} 
            open={sidebarOpenState}
            onOpenChange={sidebarOnOpenChange}
            side="left"
            onMouseEnter={() => {
              if (!isMobile && !isSidebarPinned) {
                setIsSidebarHovered(true);
              }
            }}
            onMouseLeave={() => {
              if (!isMobile && !isSidebarPinned) {
                setIsSidebarHovered(false);
              }
            }}
          >
            <ScrollArea className="h-full">
              <SidebarContent className="p-0"> 
                 <div className="p-4 space-y-4"> 
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
                  onFillPath={handleFillPath}
                  symmetrySettings={symmetry}
                  animationSettings={animation}
                  drawingTools={tools}
                  shapeSettings={shapeSettings}
                  backgroundColor={tools.backgroundColor}
                  selectedImageId={selectedImageId}
                  onImageSelect={handleImageSelect}
                  onImageUpdate={handleImageUpdate}
                  isFillModeActive={isFillModeActive}
                />
             </div>
          </SidebarInset>
          {isPreviewVisible && (
            <div className="absolute top-4 right-4 z-30 w-[clamp(250px,25vw,400px)] h-[clamp(150px,20vw,300px)] bg-card border-2 border-primary shadow-2xl rounded-lg p-1 overflow-hidden">
              <PreviewCanvas
                completedPaths={paths}
                drawingTools={tools}
                mainCanvasDimensions={mainCanvasDimensions}
              />
            </div>
          )}
        </div>
      </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
