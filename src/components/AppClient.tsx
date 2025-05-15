
"use client";

import type { Point, Path, CanvasImage, ShapeType, CanvasText } from "@/types/drawing";
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { SymmetryControl } from '@/components/controls/SymmetrySettings';
import { AnimationControl } from '@/components/controls/AnimationSettings';
import { DrawingToolControl } from '@/components/controls/DrawingTools';
import { ShapeControl } from '@/components/controls/ShapeSettings';
import { ActionToolbar } from '@/components/controls/ActionToolbar';
import { PreviewCanvas } from '@/components/canvas/PreviewCanvas';
import { ImageUploadControl } from '@/components/controls/ImageUploadControl';
import { DrawingCanvas } from './canvas/DrawingCanvas';

import { Sidebar, SidebarProvider, SidebarContent } from '@/components/ui/sidebar';
import { ScrollArea } from "@/components/ui/scroll-area";
import ThemeToggle from '@/components/theme-toggle';
import { HegArtLogo } from '@/components/icons/HegArtLogo';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Menu, Pin, PinOff, Shapes as ShapesIcon, Palette as PaletteIcon, Image as ImageIconLucide, Wand2 as SymmetryIcon, Zap as AnimationIcon, SlidersHorizontal, Presentation as PreviewIconLucide, ListCollapse, Type as TextIcon, HelpCircle, ZoomIn, ZoomOut, RefreshCw as ResetViewIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from 'next/link';
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
import { cn } from "@/lib/utils";


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
  isFixedShape: boolean;
  excludeFromAnimation: boolean;
}

export interface TextSettings {
  content: string;
  fontFamily: string;
  fontSize: number; // in pixels
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

interface CanvasHistoryState {
  paths: Path[];
  images: CanvasImage[];
  texts: CanvasText[];
}

export interface CanvasViewTransform {
  pan: { x: number, y: number };
  zoom: number;
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
const initialTextSettings: TextSettings = {
  content: "HegArt",
  fontFamily: "Montserrat",
  fontSize: 48,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  textBaseline: 'top',
};
const initialCanvasViewTransform: CanvasViewTransform = { pan: { x: 0, y: 0 }, zoom: 1 };

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";


export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [texts, setTexts] = useState<CanvasText[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [history, setHistory] = useState<CanvasHistoryState[]>([]);

  const [symmetry, setSymmetry] = useState<SymmetrySettings>(initialSymmetrySettings);
  const [animation, setAnimation] = useState<AnimationSettings>(initialAnimationSettings);
  const [tools, setTools] = useState<DrawingTools>(() => {
    const isSystemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultIsDark = false;
    const isDarkMode = isSystemDark || defaultIsDark;
    return {
      ...initialDrawingToolsBase,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      fillColor: isDarkMode ? '#FFFFFF40' : '#00000040', 
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    };
  });
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>(initialShapeSettings);
  const [textSettings, setTextSettings] = useState<TextSettings>(initialTextSettings);
  const [isFillModeActive, setIsFillModeActive] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const [activeSections, setActiveSections] = useState<Set<HeaderControlSelectionId>>(() => new Set<HeaderControlSelectionId>()); 
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  const { theme, systemTheme } = useTheme();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mainCanvasDimensions, setMainCanvasDimensions] = useState({ width: 800, height: 600 });
  const [canvasViewTransform, setCanvasViewTransform] = useState<CanvasViewTransform>(initialCanvasViewTransform);


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const isMobile = useIsMobile();

  const snapshotState = useCallback(() => {
    setHistory(prev => [...prev, { paths, images, texts }]);
  }, [paths, images, texts]);

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
      const parentElement = canvas.parentElement?.parentElement; // The main tag is parent.parentElement
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

  useEffect(() => {
    setShowWelcomeDialog(true);
  }, []);


  const handlePathAdd = useCallback((newPath: Path) => {
     snapshotState();
     const augmentedPath: Path = {
      ...newPath,
      isFixedShape: shapeSettings.isFixedShape,
      excludeFromAnimation: shapeSettings.excludeFromAnimation,
    };
     setPaths((prevPaths) => [...prevPaths, augmentedPath]);
     setCurrentPath([]);
     setSelectedImageId(null);
  }, [snapshotState, shapeSettings.isFixedShape, shapeSettings.excludeFromAnimation]);

  const handleTextAdd = useCallback((newText: CanvasText) => {
    snapshotState();
    setTexts(prev => [...prev, newText]);
    setSelectedImageId(null);
  }, [snapshotState]);

  const handleFillPath = useCallback((pathIndex: number, fillColor: string) => {
    snapshotState();
    setPaths(prevPaths => prevPaths.map((p, idx) =>
      idx === pathIndex ? { ...p, fillColor } : p
    ));
    toast({ title: "Shape Filled", description: "The selected shape has been filled." });
  }, [toast, snapshotState]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const dataUrl = result;
        const img = new window.Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const canvasWidth = mainCanvasDimensions.width || 800;
            const canvasHeight = mainCanvasDimensions.height || 600;

            let w = img.naturalWidth;
            let h = img.naturalHeight;

            const maxDimPercentage = Math.min(canvasWidth, canvasHeight) * 0.3;
            const maxDimAbsolute = 300;
            const maxDim = Math.min(maxDimPercentage, maxDimAbsolute);

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
            snapshotState();
            setImages(prev => [...prev, newImage]);
            setSelectedImageId(newImage.id);
            setIsFillModeActive(false);
            toast({ title: "Image Added", description: "The image has been added to the canvas. Click and drag to move." });
          } else {
            toast({ variant: "destructive", title: "Image Error", description: "Invalid image dimensions after loading." });
          }
        };
        img.onerror = () => {
          toast({ variant: "destructive", title: "Image Load Error", description: "Could not load the image content. The file might be corrupted or an unsupported format." });
        };
        img.src = dataUrl;
      } else {
        toast({ variant: "destructive", title: "File Read Error", description: "Failed to read the image file as a data URL." });
      }
    };
    reader.onerror = () => {
       toast({ variant: "destructive", title: "File Read Error", description: "An error occurred while trying to read the image file." });
    };

    if (file.type.startsWith('image/') || file.name.match(/\.(heic|heif)$/i)) {
        reader.readAsDataURL(file);
    } else {
        toast({ variant: "destructive", title: "Unsupported File", description: "Please select a valid image file (e.g., PNG, JPG, GIF, HEIC)." });
    }
  }, [mainCanvasDimensions, toast, snapshotState]);

  const handleImageUpdate = useCallback((updatedImage: CanvasImage) => {
    setImages(prevImages => prevImages.map(img => img.id === updatedImage.id ? updatedImage : img));
  }, []);

  const handleImageSelect = useCallback((id: string | null) => {
    setSelectedImageId(id);
    if (id) setIsFillModeActive(false);
  }, []);


  const handleClearCanvas = useCallback(() => {
     snapshotState();
     setPaths([]);
     setCurrentPath([]);
     setImages([]);
     setTexts([]);
     setSelectedImageId(null);
     setIsFillModeActive(false);
     toast({ title: "Canvas Cleared", description: "Drawing, images, and text have been cleared." });
  }, [snapshotState, toast]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
        const previousState = history[history.length - 1];
        setPaths(previousState.paths);
        setImages(previousState.images);
        setTexts(previousState.texts);
        setHistory((prevHistory) => prevHistory.slice(0, -1));

        setCurrentPath([]);
        setSelectedImageId(null);
        toast({ title: "Undo Successful", description: "Last action undone." });
    } else {
      toast({ title: "Nothing to Undo", description: "Canvas is at earliest state." });
    }
  }, [history, toast]);

  const canUndo = history.length > 0;


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
      
      const { pan, zoom } = canvasViewTransform;
      const saveWidth = Math.max(1, mainCanvasDimensions.width);
      const saveHeight = Math.max(1, mainCanvasDimensions.height);
      tempCanvas.width = saveWidth;
      tempCanvas.height = saveHeight;
      
      tempCtx.fillStyle = tools.backgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      tempCtx.translate(pan.x, pan.y);
      tempCtx.scale(zoom, zoom);


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
      
      const initialWorldCenterForSymmetry = {
        x: mainCanvasDimensions.width / 2, 
        y: mainCanvasDimensions.height / 2
      };


      const drawStaticSymmetricPathOrFixed = (originalPath: Path) => {
        if (originalPath.isFixedShape) {
          drawStaticPath(tempCtx, originalPath.points, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          return;
        }

        const ctx = tempCtx;
        const centerX = initialWorldCenterForSymmetry.x; 
        const centerY = initialWorldCenterForSymmetry.y;
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
            const mirroredXPath = originalPath.points.map(p => ({x: 2 * centerX - p.x, y: p.y})).map(transformPoint);
            drawStaticPath(ctx, mirroredXPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
          if (symmetry.mirrorY) {
             const mirroredYPath = originalPath.points.map(p => ({x: p.x, y: 2 * centerY - p.y})).map(transformPoint);
             drawStaticPath(ctx, mirroredYPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
          if (symmetry.mirrorX && symmetry.mirrorY) {
              const mirroredXYPath = originalPath.points.map(p => ({x: 2 * centerX - p.x, y: 2 * centerY - p.y})).map(transformPoint);
              drawStaticPath(ctx, mirroredXYPath, originalPath.color, originalPath.lineWidth, originalPath.fillColor);
          }
        }
      };
      paths.forEach(path => drawStaticSymmetricPathOrFixed(path));

      const imageLoadPromises = images.map(imgData => {
        return new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            const numAxes = symmetry.rotationalAxes > 0 ? symmetry.rotationalAxes : 1;
            const canvasCenterX = initialWorldCenterForSymmetry.x; 
            const canvasCenterY = initialWorldCenterForSymmetry.y;

            for (let i = 0; i < numAxes; i++) {
                const rotationAngle = (i * 2 * Math.PI) / numAxes;
                const applyTransformAndDraw = (currentX: number, currentY: number, currentWidth: number, currentHeight: number, scaleX: number = 1, scaleY: number = 1) => {
                    tempCtx.save();
                    tempCtx.translate(canvasCenterX, canvasCenterY);
                    tempCtx.rotate(rotationAngle);
                    tempCtx.translate(-canvasCenterX, -canvasCenterY);
                    tempCtx.translate(currentX + (scaleX === -1 ? currentWidth : 0) , currentY + (scaleY === -1 ? currentHeight : 0));
                    tempCtx.scale(scaleX, scaleY);
                    tempCtx.drawImage(img, 0, 0, currentWidth, currentHeight);
                    tempCtx.restore();
                };
                
                applyTransformAndDraw(imgData.x, imgData.y, imgData.width, imgData.height);
                if (symmetry.mirrorX) {
                    applyTransformAndDraw(2 * canvasCenterX - imgData.x - imgData.width, imgData.y, imgData.width, imgData.height, -1, 1);
                }
                if (symmetry.mirrorY) {
                    applyTransformAndDraw(imgData.x, 2 * canvasCenterY - imgData.y - imgData.height, imgData.width, imgData.height, 1, -1);
                }
                if (symmetry.mirrorX && symmetry.mirrorY) {
                    applyTransformAndDraw(2 * canvasCenterX - imgData.x - imgData.width, 2 * canvasCenterY - imgData.y - imgData.height, imgData.width, imgData.height, -1, -1);
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

      texts.forEach(textData => {
        const { text, x, y, fontFamily, fontSize, fontWeight, fontStyle, color, textAlign, textBaseline, isFixedShape } = textData; 
        tempCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`; 
        tempCtx.fillStyle = color;
        tempCtx.textAlign = textAlign;
        tempCtx.textBaseline = textBaseline;

        if (isFixedShape) {
            tempCtx.fillText(text, x, y);
            return;
        }

        const numAxes = symmetry.rotationalAxes > 0 ? symmetry.rotationalAxes : 1;
        const canvasCenterX = initialWorldCenterForSymmetry.x;
        const canvasCenterY = initialWorldCenterForSymmetry.y;

        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI) / numAxes;
            const transformAndDrawText = (originX: number, originY: number, applyMirrorX: boolean, applyMirrorY: boolean) => {
                let worldDrawX = originX;
                let worldDrawY = originY;
                if (applyMirrorX) worldDrawX = 2 * canvasCenterX - originX;
                if (applyMirrorY) worldDrawY = 2 * canvasCenterY - originY;
                
                tempCtx.save();
                tempCtx.translate(canvasCenterX, canvasCenterY);
                tempCtx.rotate(angle);
                tempCtx.translate(-canvasCenterX, -canvasCenterY);
                tempCtx.fillText(text, worldDrawX, worldDrawY);
                tempCtx.restore();
            };

            transformAndDrawText(x, y, false, false);
            if (symmetry.mirrorX) transformAndDrawText(x, y, true, false);
            if (symmetry.mirrorY) transformAndDrawText(x, y, false, true);
            if (symmetry.mirrorX && symmetry.mirrorY) transformAndDrawText(x, y, true, true);
        }
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
        console.error("Could not save drawing due to image/text processing error:", error);
        toast({ variant: "destructive", title: "Save Error", description: "Failed to process elements for saving." });
      }
    }
  }, [canvasRef, paths, images, texts, tools.backgroundColor, symmetry, mainCanvasDimensions, toast, canvasViewTransform]);

  const handleResetSettings = useCallback(() => {
    setSymmetry(initialSymmetrySettings);
    setAnimation(initialAnimationSettings);
    setTextSettings(initialTextSettings);
    setCanvasViewTransform(initialCanvasViewTransform);

    const currentThemeResolved = theme === 'system' ? systemTheme : theme;
    const isDarkMode = currentThemeResolved === 'dark';
    setTools({
      ...initialDrawingToolsBase,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      fillColor: isDarkMode ? '#FFFFFF40' : '#00000040',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    });
    setShapeSettings(initialShapeSettings);
    handleClearCanvas();
    setHistory([]);
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
      setIsSidebarHovered(false); // Ensure hover doesn't interfere when pinning
    }
  };

  const toggleFillMode = useCallback(() => {
    setIsFillModeActive(prev => {
        const nextState = !prev;
        if (nextState) {
            setSelectedImageId(null);
            setCurrentPath([]);
            toast({ title: "Fill Mode Activated", description: "Click on shapes to fill them.", duration: 2000 });
        } else {
            toast({ title: "Fill Mode Deactivated", description: "Drawing mode re-enabled.", duration: 2000 });
        }
        return nextState;
    });
  }, [toast]);


  const togglePreview = () => setIsPreviewVisible(prev => !prev);

  const handleSectionSelect = (sectionName: HeaderControlSelectionId) => {
    let newSectionsSize = 0;
    setActiveSections(prevActiveSections => {
        const newActive = new Set(prevActiveSections);
        if (sectionName === 'all') {
            if (newActive.has('all')) { 
                newActive.clear(); 
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
        }
        newSectionsSize = newActive.size;
        return newActive;
    });

    if (isMobile) {
        if (newSectionsSize > 0) {
            setIsMobileSidebarOpen(true);
        } else if (newSectionsSize === 0 && activeSections.size > 0) { // only close if it *was* open due to sections
           setIsMobileSidebarOpen(false);
        }
    }
  };

  const handleCanvasViewTransformChange = useCallback((newTransform: CanvasViewTransform) => {
    setCanvasViewTransform(newTransform);
  }, []);

  const handleManualZoom = (direction: 'in' | 'out') => {
    if (mainCanvasDimensions.width === 0 || mainCanvasDimensions.height === 0) return;
    const scaleFactor = direction === 'in' ? 1.2 : 1 / 1.2;
    const newZoom = Math.max(0.1, Math.min(canvasViewTransform.zoom * scaleFactor, 10));
    const centerX = mainCanvasDimensions.width / 2; 
    const centerY = mainCanvasDimensions.height / 2;
    const worldCenterX = (centerX - canvasViewTransform.pan.x) / canvasViewTransform.zoom;
    const worldCenterY = (centerY - canvasViewTransform.pan.y) / canvasViewTransform.zoom;
    const newPanX = centerX - worldCenterX * newZoom;
    const newPanY = centerY - worldCenterY * newZoom;
    setCanvasViewTransform({ pan: { x: newPanX, y: newPanY }, zoom: newZoom });
  };

  const handleResetView = () => {
    setCanvasViewTransform(initialCanvasViewTransform);
  };


  const controlPanelSections: { name: ControlSectionId; label: string; icon: React.ElementType }[] = [
    { name: 'actions', label: 'Actions', icon: SlidersHorizontal },
    { name: 'shapes', label: 'Shapes & Text', icon: ShapesIcon },
    { name: 'tools', label: 'Drawing Tools', icon: PaletteIcon },
    { name: 'image', label: 'Image Controls', icon: ImageIconLucide },
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
            <Accordion type="multiple" className="w-full space-y-1" defaultValue={isMobile ? [] : controlPanelSections.map(s => s.name)}>
                {controlPanelSections.map(sectionConfig => {
                    let sectionContent: JSX.Element | null = null;
                    switch (sectionConfig.name) {
                        case 'actions':
                            sectionContent = <ActionToolbar onClear={handleClearCanvas} onSave={handleSaveDrawing} onUndo={handleUndo} canUndo={canUndo} onResetSettings={handleResetSettings} isRecording={isRecording} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording} />;
                            break;
                        case 'shapes':
                            sectionContent = <ShapeControl shapeSettings={shapeSettings} onShapeSettingsChange={setShapeSettings} textSettings={textSettings} onTextSettingsChange={setTextSettings} />;
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
      return <div className="p-4 text-muted-foreground text-center">Select a control section from the header icons to display its settings here.</div>;
    }

    const componentsToRender: JSX.Element[] = [];
    for (const sectionName of controlSectionOrder) {
      if (activeSections.has(sectionName)) {
        let sectionContent: JSX.Element | null = null;
        const sectionConfig = controlPanelSections.find(s => s.name === sectionName);
        if (!sectionConfig) continue;

        switch (sectionName) {
          case 'actions':
            sectionContent = <div key="actions" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><ActionToolbar onClear={handleClearCanvas} onSave={handleSaveDrawing} onUndo={handleUndo} canUndo={canUndo} onResetSettings={handleResetSettings} isRecording={isRecording} onStartRecording={handleStartRecording} onStopRecording={handleStopRecording}/></div>;
                            break;
          case 'shapes':
            sectionContent = <div key="shapes" className="space-y-2"><h3 className="text-base font-medium flex items-center gap-2"><sectionConfig.icon className="h-4 w-4" />{sectionConfig.label}</h3><ShapeControl shapeSettings={shapeSettings} onShapeSettingsChange={setShapeSettings} textSettings={textSettings} onTextSettingsChange={setTextSettings} /></div>;
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

  const sidebarActualOpenState = (activeSections.size > 0) && (isMobile ? isMobileSidebarOpen : (isSidebarPinned || isSidebarHovered));
  const sidebarIsVisuallyExpanded = sidebarActualOpenState && (isMobile || isSidebarPinned || isSidebarHovered);


  const sidebarOnOpenChangeHandler = (newOpenState: boolean) => {
    if (isMobile) {
        setIsMobileSidebarOpen(newOpenState);
    } else {
        // For desktop, this function might be called by the Sidebar component itself if it has internal collapse triggers.
        // We primarily control desktop visibility via isSidebarPinned and isSidebarHovered.
        // If it's being closed and it was pinned, unpin it.
        if (!newOpenState && isSidebarPinned) {
            setIsSidebarPinned(false);
        }
    }
  };

  useEffect(() => {
    if (isMobile && activeSections.size === 0 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
    }
  }, [activeSections, isMobileSidebarOpen, isMobile]);

  // CSS variables for dynamic padding
  const mainContentStyle = {
    "--sidebar-width": SIDEBAR_WIDTH,
    "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
  } as React.CSSProperties;


  return (
    <SidebarProvider defaultOpen={isSidebarPinned || (activeSections.size > 0 && isSidebarHovered)}>
       <TooltipProvider>
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HegArtLogo className="h-8 w-8" />
                Welcome to #HegArt!
              </DialogTitle>
              <DialogDescription>
                Unleash your creativity with symmetric and animated art. Explore the controls by clicking the header icons to reveal sections in the sidebar. Start drawing!
                 For a quick overview, check out the video below or visit the "How To" page.
              </DialogDescription>
            </DialogHeader>
             <div className="flex justify-center items-center my-4 aspect-video w-full max-w-sm mx-auto">
                <Image src="/welcome.png" alt="HegArt Welcome Image" width={400} height={225} className="rounded-md shadow-lg w-full h-full object-cover" data-ai-hint="abstract art" />
            </div>
            <DialogFooter>
              <Button onClick={() => setShowWelcomeDialog(false)}>Get Started!</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <div className="flex h-screen w-full flex-col" style={mainContentStyle}>
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <HegArtLogo className="h-8 w-auto hidden sm:block" />
             <h1 className="font-montserrat text-xl font-bold uppercase tracking-wider sm:block whitespace-nowrap">#HegArt</h1>
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
             <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/how-to" className={buttonVariants({ variant: "ghost", size: "icon" })}>
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">How to Use #HegArt</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent><p>How to Use #HegArt</p></TooltipContent>
              </Tooltip>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar
            className="border-r z-40" // Ensure sidebar visual is above canvas but potentially below modals
            collapsible={isMobile ? "none" : "icon"} // "icon" for desktop collapse to icons
            open={sidebarActualOpenState} // Controls if sidebar is 'expanded' or 'collapsed' state for its internal styling
            onOpenChange={sidebarOnOpenChangeHandler} // For mobile sheet primarily
            side="left"
            onMouseEnter={() => {
              if (!isMobile && !isSidebarPinned && activeSections.size > 0) { 
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
                 {sidebarIsVisuallyExpanded && ( 
                    <div className="p-4 space-y-4">
                      {renderActiveSectionContent()}
                    </div>
                  )}
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          
          <main className={cn(
              "flex-1 overflow-auto p-0 relative h-full transition-[padding-left] duration-200 ease-linear",
              !isMobile && isSidebarPinned && sidebarIsVisuallyExpanded && activeSections.size > 0 ? "pl-[var(--sidebar-width)]" : "",
              !isMobile && isSidebarPinned && (!sidebarIsVisuallyExpanded || activeSections.size === 0) ? "pl-[var(--sidebar-width-icon)]" : ""
              // When unpinned (!isSidebarPinned), padding-left is 0 (default), allowing sidebar to overlay.
            )}
          >
             <div className="relative w-full h-full overflow-hidden">
                <DrawingCanvas
                  ref={canvasRef}
                  paths={paths}
                  images={images}
                  texts={texts}
                  currentPath={currentPath}
                  onCurrentPathChange={setCurrentPath}
                  onPathAdd={handlePathAdd}
                  onTextAdd={handleTextAdd}
                  onFillPath={handleFillPath}
                  symmetrySettings={symmetry}
                  animationSettings={animation}
                  drawingTools={tools}
                  shapeSettings={shapeSettings}
                  textSettings={textSettings}
                  backgroundColor={tools.backgroundColor}
                  selectedImageId={selectedImageId}
                  onImageSelect={handleImageSelect}
                  onImageUpdate={handleImageUpdate}
                  isFillModeActive={isFillModeActive}
                  canvasViewTransform={canvasViewTransform}
                  onCanvasViewTransformChange={handleCanvasViewTransformChange}
                  initialMainCanvasDimensions={mainCanvasDimensions}
                />
                <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 bg-background/50 p-1 rounded-md shadow-md">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleManualZoom('in')} className="h-8 w-8">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Zoom In</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleManualZoom('out')} className="h-8 w-8">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Zoom Out</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleResetView} className="h-8 w-8">
                                <ResetViewIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Reset View</p></TooltipContent>
                    </Tooltip>
                </div>
             </div>
          </main>
          {isPreviewVisible && (
            <div className="absolute top-4 right-4 z-30 w-[clamp(250px,25vw,400px)] h-[clamp(150px,20vw,300px)] bg-card border-2 border-primary shadow-2xl rounded-lg p-1 overflow-hidden">
              <PreviewCanvas
                completedPaths={paths}
                completedImages={images}
                completedTexts={texts}
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
