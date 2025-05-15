
"use client";

import type { Point, Path, CanvasImage, CanvasText } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings, TextSettings, CanvasViewTransform } from "@/components/AppClient";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo, WheelEvent as ReactWheelEvent, MouseEvent as ReactMouseEvent } from 'react';
import { drawShape } from './shapeUtils';

interface DrawingCanvasProps {
  paths: Path[];
  images: CanvasImage[];
  texts: CanvasText[];
  currentPath: Point[];
  onCurrentPathChange: (path: Point[]) => void;
  onPathAdd: (path: Path) => void;
  onTextAdd: (text: CanvasText) => void;
  onFillPath: (pathIndex: number, fillColor: string) => void; 
  symmetrySettings: SymmetrySettings;
  animationSettings: AnimationSettings;
  drawingTools: DrawingTools;
  shapeSettings: ShapeSettings;
  textSettings: TextSettings;
  backgroundColor: string;
  selectedImageId: string | null;
  onImageSelect: (id: string | null) => void;
  onImageUpdate: (updatedImage: CanvasImage) => void;
  isFillModeActive: boolean; 
  canvasViewTransform: CanvasViewTransform;
  onCanvasViewTransformChange: (transform: CanvasViewTransform) => void;
  initialMainCanvasDimensions: { width: number, height: number }; 
}

// Helper to transform a point based on symmetry settings (operates in world coordinates)
const transformSymmetricPoint = (
    p: Point, // point in world coordinates
    worldSymmetryCenterX: number,
    worldSymmetryCenterY: number,
    baseAngle: number,
    applyMirrorX: boolean,
    applyMirrorY: boolean,
    isRotationalContext: boolean
): Point => {
    let { x, y } = p; // world coordinates

    // Mirroring is done first, relative to the world symmetry center
    if (applyMirrorX) x = 2 * worldSymmetryCenterX - x; // Reflect across vertical line through worldSymmetryCenterX
    if (applyMirrorY) y = 2 * worldSymmetryCenterY - y; // Reflect across horizontal line through worldSymmetryCenterY
    
    if (isRotationalContext) {
        // Translate to origin (relative to worldSymmetryCenter), rotate, then translate back
        const translatedX = x - worldSymmetryCenterX;
        const translatedY = y - worldSymmetryCenterY;
        const cosA = Math.cos(baseAngle);
        const sinA = Math.sin(baseAngle);
        const rotatedX = translatedX * cosA - translatedY * sinA;
        const rotatedY = translatedX * sinA + translatedY * cosA;
        x = rotatedX + worldSymmetryCenterX;
        y = rotatedY + worldSymmetryCenterY;
    }
    return { x, y };
};


export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({
    paths,
    images,
    texts,
    currentPath,
    onCurrentPathChange,
    onPathAdd,
    onTextAdd,
    onFillPath,
    symmetrySettings,
    animationSettings,
    drawingTools,
    shapeSettings,
    textSettings,
    backgroundColor,
    selectedImageId,
    onImageSelect,
    onImageUpdate,
    isFillModeActive,
    canvasViewTransform,
    onCanvasViewTransformChange,
    initialMainCanvasDimensions,
  }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPointRef = useRef<{ x: number, y: number } | null>(null);

    const dragStartPointRef = useRef<{ x: number, y: number } | null>(null); // world coords
    const imageStartPosRef = useRef<{ x: number, y: number } | null>(null); // world coords
    
    const animationFrameId = useRef<number | null>(null);
    const lastAnimationTime = useRef<number>(0);
    const globalPulseOffset = useRef<number>(0); 
    const totalRotation = useRef<number>(0);
    const spinDirection = useRef<number>(1);
    const lastSpinDirectionChangeTime = useRef<number>(0);

    const [loadedHtmlImages, setLoadedHtmlImages] = useState<Record<string, HTMLImageElement>>({});

     const initialWorldCenter = useMemo(() => ({
        x: initialMainCanvasDimensions.width / 2,
        y: initialMainCanvasDimensions.height / 2,
    }), [initialMainCanvasDimensions]);


    useEffect(() => {
        const promises: Promise<{id: string, img: HTMLImageElement}>[] = [];
        const imagesToLoadOrUpdate = images.filter(
            (imgData) => !loadedHtmlImages[imgData.id] || loadedHtmlImages[imgData.id].src !== imgData.src
        );

        imagesToLoadOrUpdate.forEach(imgData => {
            promises.push(
                new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve({ id: imgData.id, img });
                    img.onerror = () => {
                         console.error(`Failed to load image ${imgData.id}: ${imgData.src}`);
                         reject(new Error(`Failed to load image ${imgData.id}`));
                    };
                    img.src = imgData.src;
                })
            );
        });

        if (promises.length > 0) {
            Promise.all(promises)
                .then(results => {
                    setLoadedHtmlImages(prev => {
                        const updated = { ...prev };
                        results.forEach(r => updated[r.id] = r.img);
                        return updated;
                    });
                })
                .catch(error => console.error("Error loading one or more images:", error));
        }

        const currentImageIds = new Set(images.map(im => im.id));
        setLoadedHtmlImages(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                if (!currentImageIds.has(id)) {
                    delete next[id];
                    changed = true;
                }
            });
            if (changed) return next;
            return prev; 
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images]);


    const getCanvasCoordinates = (event: ReactMouseEvent | React.TouchEvent<HTMLCanvasElement>): Point | null => {
      if (!internalCanvasRef.current) return null;
      const canvas = internalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      if ('touches' in event) {
         if (event.touches.length === 0) return null;
         clientX = event.touches[0].clientX;
         clientY = event.touches[0].clientY;
       } else {
         clientX = event.clientX;
         clientY = event.clientY;
       }
      
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      const worldX = (screenX - canvasViewTransform.pan.x) / canvasViewTransform.zoom;
      const worldY = (screenY - canvasViewTransform.pan.y) / canvasViewTransform.zoom;
      
      return { x: worldX, y: worldY };
    };

    const handleFillAttempt = (worldClickPoint: Point) => {
        if (!internalCanvasRef.current) return;
        const canvas = internalCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let filledPathIndex = -1;
        
        for (let i = paths.length - 1; i >= 0; i--) {
            const pathData = paths[i];
            if (pathData.points.length < 1) continue;

            ctx.save(); 
            ctx.beginPath();

            if (pathData.isFixedShape) { 
                 ctx.moveTo(pathData.points[0].x, pathData.points[0].y);
                 for (let k = 1; k < pathData.points.length; k++) {
                     ctx.lineTo(pathData.points[k].x, pathData.points[k].y);
                 }
                 if (pathData.points.length > 2) ctx.closePath();
                 if (ctx.isPointInPath(worldClickPoint.x, worldClickPoint.y)) {
                     filledPathIndex = i;
                 }
            } else {
                const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;
                for (let axisIdx = 0; axisIdx < numAxes; axisIdx++) {
                    const angle = (axisIdx * 2 * Math.PI) / numAxes;
                    const isRotContext = numAxes > 1;

                    const mirrorsToTest = [
                        { mx: false, my: false }, 
                        ...(symmetrySettings.mirrorX ? [{ mx: true, my: false }] : []),
                        ...(symmetrySettings.mirrorY ? [{ mx: false, my: true }] : []),
                        ...(symmetrySettings.mirrorX && symmetrySettings.mirrorY ? [{ mx: true, my: true }] : []),
                    ];
                    
                    for (const mirror of mirrorsToTest) {
                        ctx.beginPath(); 
                        const firstTransformedPoint = transformSymmetricPoint(pathData.points[0], initialWorldCenter.x, initialWorldCenter.y, angle, mirror.mx, mirror.my, isRotContext);
                        ctx.moveTo(firstTransformedPoint.x, firstTransformedPoint.y);
                        for (let k = 1; k < pathData.points.length; k++) {
                            const transformedPoint = transformSymmetricPoint(pathData.points[k], initialWorldCenter.x, initialWorldCenter.y, angle, mirror.mx, mirror.my, isRotContext);
                            ctx.lineTo(transformedPoint.x, transformedPoint.y);
                        }
                        
                        if (pathData.points.length > 2) ctx.closePath();

                        if (ctx.isPointInPath(worldClickPoint.x, worldClickPoint.y)) {
                            filledPathIndex = i;
                            break; 
                        }
                    }
                    if (filledPathIndex !== -1) break; 
                }
            }
            ctx.restore(); 
            if (filledPathIndex !== -1) break; 
        }


        if (filledPathIndex !== -1) {
            onFillPath(filledPathIndex, drawingTools.fillColor);
            onImageSelect(null); 
        }
    };


    const startDrawing = (event: ReactMouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
      if ('button' in event && event.button === 1) { 
        handleMiddleMouseDown(event as ReactMouseEvent);
        return;
      }
      if ('touches' in event && event.touches.length > 1) return; 

      event.preventDefault();
      const worldPoint = getCanvasCoordinates(event);
      if (!worldPoint) return;

      if (isFillModeActive) {
        handleFillAttempt(worldPoint);
        return; 
      }

      if (shapeSettings.currentShape === 'text') {
        if (textSettings.content.trim() === "") return; 
        const newTextObject: CanvasText = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: textSettings.content,
            x: worldPoint.x, 
            y: worldPoint.y,
            fontFamily: textSettings.fontFamily,
            fontSize: textSettings.fontSize, 
            fontWeight: textSettings.fontWeight,
            fontStyle: textSettings.fontStyle,
            textAlign: textSettings.textAlign,
            textBaseline: textSettings.textBaseline,
            color: drawingTools.strokeColor,
            isFixedShape: shapeSettings.isFixedShape,
            excludeFromAnimation: shapeSettings.excludeFromAnimation,
        };
        onTextAdd(newTextObject);
        onImageSelect(null);
        setIsDrawing(false); 
        return;
      }
      
      for (let i = images.length - 1; i >= 0; i--) {
        const imgData = images[i];
        if (
          worldPoint.x >= imgData.x &&
          worldPoint.x <= imgData.x + imgData.width &&
          worldPoint.y >= imgData.y &&
          worldPoint.y <= imgData.y + imgData.height
        ) {
          onImageSelect(imgData.id);
          setIsDraggingImage(true);
          dragStartPointRef.current = worldPoint; 
          imageStartPosRef.current = { x: imgData.x, y: imgData.y }; 
          setIsDrawing(false); 
          return;
        }
      }
      
      if (selectedImageId) {
        onImageSelect(null);
      }

      setIsDrawing(true);
      onCurrentPathChange([worldPoint]); 
    };

    const draw = (event: ReactMouseEvent | React.TouchEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        handleMiddleMouseMove(event as ReactMouseEvent);
        return;
      }
      if ('touches' in event && event.touches.length > 1) return;
      
      event.preventDefault();
      if (isFillModeActive || shapeSettings.currentShape === 'text') return; 

      const worldPoint = getCanvasCoordinates(event);
      if (!worldPoint) return;

      if (isDraggingImage && selectedImageId && dragStartPointRef.current && imageStartPosRef.current) {
        const draggedImage = images.find(img => img.id === selectedImageId);
        if (draggedImage) {
          const dx = worldPoint.x - dragStartPointRef.current.x; 
          const dy = worldPoint.y - dragStartPointRef.current.y;
          onImageUpdate({
            ...draggedImage,
            x: imageStartPosRef.current.x + dx, 
            y: imageStartPosRef.current.y + dy,
          });
        }
        return;
      }

      if (!isDrawing) return;
      if (shapeSettings.currentShape === 'freehand') {
          onCurrentPathChange([...currentPath, worldPoint]); 
      } else {
          if (currentPath.length > 0) {
              onCurrentPathChange([currentPath[0], worldPoint]); 
          }
      }
    };

    const finishDrawing = () => {
      if (isPanning) {
        handleMiddleMouseUp();
        return;
      }
      if (isFillModeActive || shapeSettings.currentShape === 'text') return; 

      if (isDraggingImage) {
        setIsDraggingImage(false);
        dragStartPointRef.current = null;
        imageStartPosRef.current = null;
        return;
      }

      if (!isDrawing || currentPath.length === 0) return;
      setIsDrawing(false);
      let finalPathPoints: Point[]; 
      if (shapeSettings.currentShape !== 'freehand' && currentPath.length === 2) {
          finalPathPoints = drawShape(shapeSettings.currentShape, currentPath[0], currentPath[1], initialMainCanvasDimensions.width, initialMainCanvasDimensions.height);
      } else {
          finalPathPoints = currentPath;
      }
       if (finalPathPoints.length >= (shapeSettings.currentShape === 'line' || shapeSettings.currentShape === 'arrow' || shapeSettings.currentShape === 'checkMark' ? 2 : 1)) {
          onPathAdd({ 
            points: finalPathPoints, 
            color: drawingTools.strokeColor,
            lineWidth: drawingTools.lineWidth, 
            fillColor: shapeSettings.currentShape !== 'freehand' && shapeSettings.currentShape !== 'line' && shapeSettings.currentShape !== 'arrow' && shapeSettings.currentShape !== 'checkMark' ? drawingTools.fillColor : undefined, 
          });
       }
      onCurrentPathChange([]);
    };

    const handleMiddleMouseDown = (event: ReactMouseEvent) => {
        if (event.button === 1) { 
            event.preventDefault();
            setIsPanning(true);
            lastPanPointRef.current = { x: event.clientX, y: event.clientY };
        }
    };
    const handleMiddleMouseMove = (event: ReactMouseEvent) => {
        if (!isPanning || !lastPanPointRef.current) return;
        event.preventDefault();
        const dx = event.clientX - lastPanPointRef.current.x;
        const dy = event.clientY - lastPanPointRef.current.y;
        onCanvasViewTransformChange({
            ...canvasViewTransform,
            pan: {
                x: canvasViewTransform.pan.x + dx,
                y: canvasViewTransform.pan.y + dy,
            }
        });
        lastPanPointRef.current = { x: event.clientX, y: event.clientY };
    };
    const handleMiddleMouseUp = () => {
        setIsPanning(false);
        lastPanPointRef.current = null;
    };

    const handleWheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
        event.preventDefault();
        if (!internalCanvasRef.current) return;
        const canvas = internalCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const scaleAmount = 1.1;
        const newZoomNoClamp = event.deltaY < 0 ? canvasViewTransform.zoom * scaleAmount : canvasViewTransform.zoom / scaleAmount;
        const newZoom = Math.max(0.1, Math.min(newZoomNoClamp, 10));

        const mouseX = event.clientX - rect.left; 
        const mouseY = event.clientY - rect.top;   

        const worldXBefore = (mouseX - canvasViewTransform.pan.x) / canvasViewTransform.zoom;
        const worldYBefore = (mouseY - canvasViewTransform.pan.y) / canvasViewTransform.zoom;

        const newPanX = mouseX - worldXBefore * newZoom;
        const newPanY = mouseY - worldYBefore * newZoom;

        onCanvasViewTransformChange({ pan: { x: newPanX, y: newPanY }, zoom: newZoom });
    };


    const drawSinglePath = (
        ctx: CanvasRenderingContext2D, 
        pathPoints: Point[], 
        strokeColor: string, 
        lineWidth: number, 
        currentLineWidthOffset: number, 
        fillColor?: string | null,
        usePreviewStyle: boolean = false
    ) => {
      if (pathPoints.length === 0) return;
      const effectiveLineWidth = lineWidth + currentLineWidthOffset; 
      
      if (effectiveLineWidth < (0.1 / canvasViewTransform.zoom) && !fillColor) return; 

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      
      const isClosedShapeByDefault = shapeSettings.currentShape !== 'line' && 
                                   shapeSettings.currentShape !== 'arrow' && 
                                   shapeSettings.currentShape !== 'checkMark' &&
                                   shapeSettings.currentShape !== 'freehand';

      if (pathPoints.length > 2 && isClosedShapeByDefault) {
           ctx.closePath(); 
      }
      
      let actualFillColor = fillColor;
      if (usePreviewStyle && fillColor) {
        if (fillColor.startsWith('#') && fillColor.length === 7) { // #RRGGBB
            actualFillColor = fillColor + '80'; // Add 50% alpha
        } else if (fillColor.startsWith('#') && fillColor.length === 9) { // #RRGGBBAA
            actualFillColor = fillColor.substring(0, 7) + '80'; // Replace alpha with 50%
        } else {
            // For other color formats like 'rgba(r,g,b,a)' or named colors,
            // a more complex parsing would be needed. For simplicity, we'll use a default preview alpha.
            // This part could be enhanced. For now, just make it slightly transparent if possible.
            // This fallback is not perfect but avoids errors.
            try {
                const tempCtx = document.createElement('canvas').getContext('2d')!;
                tempCtx.fillStyle = fillColor;
                const baseColor = tempCtx.fillStyle; // Gets #RRGGBB from named or other formats
                if (baseColor.startsWith('#') && baseColor.length === 7) {
                     actualFillColor = baseColor + '80';
                }
            } catch (e) { /* ignore if color parsing fails for preview */ }
        }
      }


      if (actualFillColor) {
        ctx.fillStyle = actualFillColor;
        ctx.fill();
      }

      if (effectiveLineWidth >= (0.1 / canvasViewTransform.zoom) ) { 
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = effectiveLineWidth; 
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (usePreviewStyle) {
            ctx.setLineDash([5 / canvasViewTransform.zoom, 5 / canvasViewTransform.zoom]);
        }
        ctx.stroke();
        if (usePreviewStyle) {
            ctx.setLineDash([]);
        }
      }
    };

    const drawSymmetricImage = (
        ctx: CanvasRenderingContext2D,
        htmlImg: HTMLImageElement,
        imgData: CanvasImage, 
        currentSymmetry: SymmetrySettings,
        isSelected: boolean
     ) => {
        const { x, y, width, height } = imgData; 
        const numAxes = currentSymmetry.rotationalAxes > 0 ? currentSymmetry.rotationalAxes : 1;
        const canvasCenterX = initialWorldCenter.x; 
        const canvasCenterY = initialWorldCenter.y;
        const isRotContext = numAxes > 1;

        for (let i = 0; i < numAxes; i++) {
            const rotationAngle = (i * 2 * Math.PI) / numAxes;
            const mirrorsToApply = [{ mx: false, my: false }];
            if (currentSymmetry.mirrorX) mirrorsToApply.push({ mx: true, my: false });
            if (currentSymmetry.mirrorY) mirrorsToApply.push({ mx: false, my: true });
            if (currentSymmetry.mirrorX && currentSymmetry.mirrorY) mirrorsToApply.push({ mx: true, my: true });
            
            for (const mirror of mirrorsToApply) {
                ctx.save(); 
                
                let worldDrawX = x;
                let worldDrawY = y;
                let scaleFactorX = 1;
                let scaleFactorY = 1;

                if (mirror.mx) {
                    worldDrawX = 2 * canvasCenterX - x - width; 
                    scaleFactorX = -1;
                }
                if (mirror.my) {
                    worldDrawY = 2 * canvasCenterY - y - height; 
                    scaleFactorY = -1;
                }

                if (isRotContext) {
                    ctx.translate(canvasCenterX, canvasCenterY);
                    ctx.rotate(rotationAngle);
                    ctx.translate(-canvasCenterX, -canvasCenterY);
                }
                
                ctx.translate(worldDrawX + (scaleFactorX === -1 ? width : 0), worldDrawY + (scaleFactorY === -1 ? height : 0));
                ctx.scale(scaleFactorX, scaleFactorY);
                ctx.drawImage(htmlImg, 0, 0, width, height); 
                
                if (isSelected && i === 0 && !mirror.mx && !mirror.my) { 
                    ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
                    const globalScale = animationSettings.isScaling ? (1 + Math.sin(0) * animationSettings.scaleIntensity) : 1; 
                    const selectionLineWidth = 2 / (canvasViewTransform.zoom * globalScale); 
                    ctx.lineWidth = selectionLineWidth; 
                    ctx.setLineDash([4 * selectionLineWidth, 2 * selectionLineWidth]); 
                    ctx.strokeRect(-selectionLineWidth, -selectionLineWidth, width + 2*selectionLineWidth, height + 2*selectionLineWidth); 
                    ctx.setLineDash([]);
                }
                ctx.restore(); 
            }
        }
     };
    
    const drawSymmetricPath = (
        ctx: CanvasRenderingContext2D,
        pathData: Path, 
        currentSymmetrySettings: SymmetrySettings,
        usePreviewStyle: boolean, // Changed from isTemporaryShape
        currentFramePulseOffset: number 
    ) => {
        const { points: originalPoints, color, lineWidth, fillColor } = pathData; 
        
        const numAxes = currentSymmetrySettings.rotationalAxes > 0 ? currentSymmetrySettings.rotationalAxes : 1;
        const isRotContext = numAxes > 1;

        for (let i = 0; i < numAxes; i++) {
           const angle = (i * 2 * Math.PI) / numAxes;
          
           const baseTransformedPath = originalPoints.map(p => transformSymmetricPoint(p, initialWorldCenter.x, initialWorldCenter.y, angle, false, false, isRotContext));
           drawSinglePath(ctx, baseTransformedPath, color, lineWidth, currentFramePulseOffset, fillColor, usePreviewStyle);

           if (currentSymmetrySettings.mirrorX) {
             const mirroredXPath = originalPoints.map(p => transformSymmetricPoint(p, initialWorldCenter.x, initialWorldCenter.y, angle, true, false, isRotContext));
             drawSinglePath(ctx, mirroredXPath, color, lineWidth, currentFramePulseOffset, fillColor, usePreviewStyle);
           }
           if (currentSymmetrySettings.mirrorY) {
             const mirroredYPath = originalPoints.map(p => transformSymmetricPoint(p, initialWorldCenter.x, initialWorldCenter.y, angle, false, true, isRotContext));
             drawSinglePath(ctx, mirroredYPath, color, lineWidth, currentFramePulseOffset, fillColor, usePreviewStyle);
           }
           if (currentSymmetrySettings.mirrorX && currentSymmetrySettings.mirrorY) {
               const mirroredXYPath = originalPoints.map(p => transformSymmetricPoint(p, initialWorldCenter.x, initialWorldCenter.y, angle, true, true, isRotContext));
               drawSinglePath(ctx, mirroredXYPath, color, lineWidth, currentFramePulseOffset, fillColor, usePreviewStyle);
           }
        }
    };

    const drawSymmetricText = (
        ctx: CanvasRenderingContext2D,
        textData: CanvasText, 
        currentSymmetrySettings: SymmetrySettings
    ) => {
        const { text, x, y, fontFamily, fontSize, fontWeight, fontStyle, color, textAlign, textBaseline } = textData;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`; 
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        const numAxes = currentSymmetrySettings.rotationalAxes > 0 ? currentSymmetrySettings.rotationalAxes : 1;
        const isRotContext = numAxes > 1;

        for (let i = 0; i < numAxes; i++) {
            const angle = (i * 2 * Math.PI) / numAxes;
            
            const mirrorsToApply = [{ mx: false, my: false }];
            if (currentSymmetrySettings.mirrorX) mirrorsToApply.push({ mx: true, my: false });
            if (currentSymmetrySettings.mirrorY) mirrorsToApply.push({ mx: false, my: true });
            if (currentSymmetrySettings.mirrorX && currentSymmetrySettings.mirrorY) mirrorsToApply.push({ mx: true, my: true });

            for (const mirror of mirrorsToApply) {
                ctx.save(); 
                
                const transformedPt = transformSymmetricPoint({x,y}, initialWorldCenter.x, initialWorldCenter.y, angle, mirror.mx, mirror.my, isRotContext);
                
                ctx.fillText(text, transformedPt.x, transformedPt.y);
                ctx.restore();
            }
        }
    };


    const renderCanvas = (time: number = 0) => {
      if (!internalCanvasRef.current) return;
      const canvas = internalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const deltaTime = time - lastAnimationTime.current;
      lastAnimationTime.current = time;

      ctx.save();
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      ctx.save();
      ctx.translate(canvasViewTransform.pan.x, canvasViewTransform.pan.y);
      ctx.scale(canvasViewTransform.zoom, canvasViewTransform.zoom);

      // Draw Center Indicator
      if (initialMainCanvasDimensions.width > 0 && initialMainCanvasDimensions.height > 0) {
          const indicatorSize = 10 / canvasViewTransform.zoom; 
          const indicatorLineWidth = 1 / canvasViewTransform.zoom; 
          ctx.save();
          ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'; 
          ctx.lineWidth = indicatorLineWidth;
          ctx.beginPath();
          ctx.moveTo(initialWorldCenter.x - indicatorSize, initialWorldCenter.y);
          ctx.lineTo(initialWorldCenter.x + indicatorSize, initialWorldCenter.y);
          ctx.moveTo(initialWorldCenter.x, initialWorldCenter.y - indicatorSize);
          ctx.lineTo(initialWorldCenter.x, initialWorldCenter.y + indicatorSize);
          ctx.stroke();
          ctx.restore();
      }


      const animCenterX = initialWorldCenter.x;
      const animCenterY = initialWorldCenter.y;

       if (animationSettings.isPulsing) {
         const pulseCycle = (time / (1000 / (animationSettings.pulseSpeed / 2))) % (2 * Math.PI);
         globalPulseOffset.current = Math.cos(pulseCycle) * animationSettings.pulseIntensity; 
       } else {
         globalPulseOffset.current = 0;
       }

      let currentScaleFactor = 1; 
      if (animationSettings.isScaling) {
         const scaleCycle = (time / (1000 / (animationSettings.scaleSpeed / 2))) % (2 * Math.PI);
         currentScaleFactor = 1 + Math.sin(scaleCycle) * animationSettings.scaleIntensity;
       }

       if (animationSettings.isSpinning && deltaTime > 0) {
           const now = performance.now();
            if (lastSpinDirectionChangeTime.current === 0 && animationSettings.spinDirectionChangeFrequency > 0) {
                lastSpinDirectionChangeTime.current = now;
            }
           const timeSinceLastChange = (now - lastSpinDirectionChangeTime.current) / 1000;
           if (animationSettings.spinDirectionChangeFrequency > 0 &&
               timeSinceLastChange >= animationSettings.spinDirectionChangeFrequency) {
               if (Math.random() < 0.5) spinDirection.current *= -1;
               lastSpinDirectionChangeTime.current = now;
           }
           const rotationDegreesPerSecond = animationSettings.spinSpeed * spinDirection.current;
           const rotationRadiansPerSecond = rotationDegreesPerSecond * (Math.PI / 180);
           const rotationThisFrame = rotationRadiansPerSecond * (deltaTime / 1000);
           totalRotation.current += rotationThisFrame;
       } else if (!animationSettings.isSpinning) {
            totalRotation.current = 0;
            lastSpinDirectionChangeTime.current = 0; 
       }
       const currentRotationAngle = totalRotation.current; 

      ctx.save(); 
      ctx.translate(animCenterX, animCenterY);
      if (animationSettings.isSpinning) ctx.rotate(currentRotationAngle);
      if (animationSettings.isScaling) ctx.scale(currentScaleFactor, currentScaleFactor);
      ctx.translate(-animCenterX, -animCenterY);

      paths.forEach(pathData => {
        if (!pathData.excludeFromAnimation) {
          const pathSpecificPulseOffset = animationSettings.isPulsing ? globalPulseOffset.current : 0;
          if (pathData.isFixedShape) {
            drawSinglePath(ctx, pathData.points, pathData.color, pathData.lineWidth, pathSpecificPulseOffset, pathData.fillColor, false);
          } else {
            drawSymmetricPath(ctx, pathData, symmetrySettings, false, pathSpecificPulseOffset);
          }
        }
      });
      images.forEach(imgData => {
        const htmlImg = loadedHtmlImages[imgData.id];
        if (htmlImg && htmlImg.complete && htmlImg.naturalWidth > 0) {
          drawSymmetricImage(ctx, htmlImg, imgData, symmetrySettings, imgData.id === selectedImageId);
        }
      });
      texts.forEach(textData => {
        if (!textData.excludeFromAnimation) {
            if (textData.isFixedShape) {
                ctx.font = `${textData.fontStyle} ${textData.fontWeight} ${textData.fontSize}px ${textData.fontFamily}`;
                ctx.fillStyle = textData.color;
                ctx.textAlign = textData.textAlign;
                ctx.textBaseline = textData.textBaseline;
                ctx.fillText(textData.text, textData.x, textData.y);
            } else {
                drawSymmetricText(ctx, textData, symmetrySettings);
            }
        }
      });
      ctx.restore(); 

      paths.forEach(pathData => {
        if (pathData.excludeFromAnimation) {
          const staticLineWidthOffset = 0; 
          if (pathData.isFixedShape) {
            drawSinglePath(ctx, pathData.points, pathData.color, pathData.lineWidth, staticLineWidthOffset, pathData.fillColor, false);
          } else {
            drawSymmetricPath(ctx, pathData, symmetrySettings, false, staticLineWidthOffset);
          }
        }
      });
      texts.forEach(textData => {
        if (textData.excludeFromAnimation) {
            ctx.font = `${textData.fontStyle} ${textData.fontWeight} ${textData.fontSize}px ${textData.fontFamily}`;
            ctx.fillStyle = textData.color;
            ctx.textAlign = textData.textAlign;
            ctx.textBaseline = textData.textBaseline;
            if (textData.isFixedShape) {
                ctx.fillText(textData.text, textData.x, textData.y);
            } else {
                drawSymmetricText(ctx, textData, symmetrySettings);
            }
        }
      });
      
      if (isDrawing && currentPath.length > 0 && !isFillModeActive && shapeSettings.currentShape !== 'text') {
        let pointsForCurrentDrawing: Point[];
        let isDrawingFullShapePreview = false;
    
        if (shapeSettings.currentShape === 'freehand') {
            pointsForCurrentDrawing = currentPath;
        } else { // It's a predefined shape
            if (currentPath.length === 2) { // Start and end points available
                pointsForCurrentDrawing = drawShape(shapeSettings.currentShape, currentPath[0], currentPath[1], initialMainCanvasDimensions.width, initialMainCanvasDimensions.height);
                isDrawingFullShapePreview = true;
            } else { // Only start point, or not enough points yet
                pointsForCurrentDrawing = currentPath; 
            }
        }
    
        const tempPreviewPath: Path = {
            points: pointsForCurrentDrawing,
            color: drawingTools.strokeColor,
            lineWidth: drawingTools.lineWidth,
            fillColor: (isDrawingFullShapePreview && 
                        shapeSettings.currentShape !== 'line' && 
                        shapeSettings.currentShape !== 'arrow' && 
                        shapeSettings.currentShape !== 'checkMark' &&
                        drawingTools.fillColor)
                       ? (drawingTools.fillColor.length === 9 ? drawingTools.fillColor.substring(0,7) + '80' : drawingTools.fillColor + '80') 
                       : undefined,
            isFixedShape: shapeSettings.isFixedShape,
            excludeFromAnimation: shapeSettings.excludeFromAnimation,
        };
    
        ctx.save(); 
        if (!tempPreviewPath.excludeFromAnimation) { // Current drawing is not subject to animation transforms usually
            ctx.translate(animCenterX, animCenterY);
            if (animationSettings.isSpinning) ctx.rotate(currentRotationAngle);
            if (animationSettings.isScaling) ctx.scale(currentScaleFactor, currentScaleFactor);
            ctx.translate(-animCenterX, -animCenterY);
        }
        
        const previewPulseOffset = (animationSettings.isPulsing && !tempPreviewPath.excludeFromAnimation && shapeSettings.currentShape === 'freehand') 
                                   ? globalPulseOffset.current 
                                   : 0; // Pulse only for freehand preview for now, shapes are dashed

        if (tempPreviewPath.isFixedShape) {
            drawSinglePath(ctx, tempPreviewPath.points, tempPreviewPath.color, tempPreviewPath.lineWidth, previewPulseOffset, tempPreviewPath.fillColor, true /* usePreviewStyle */);
        } else {
            drawSymmetricPath(ctx, tempPreviewPath, symmetrySettings, true /* usePreviewStyle */, previewPulseOffset);
        }
        ctx.restore(); 
      }
      
      ctx.restore(); 

      const isLoadingImages = images.some(img => !loadedHtmlImages[img.id]?.complete);
      const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || isLoadingImages;
      if (shouldAnimate) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null;
        if (!animationSettings.isSpinning) { 
          totalRotation.current = 0;
          lastSpinDirectionChangeTime.current = 0;
        }
      }
    };

    useEffect(() => {
      const canvas = internalCanvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const resizeObserver = new ResizeObserver(() => {
        if (parent.clientWidth > 0 && parent.clientHeight > 0) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
            renderCanvas(); 
        }
      });
      resizeObserver.observe(parent);
      if (parent.clientWidth > 0 && parent.clientHeight > 0) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
      }
      renderCanvas();

      return () => {
        resizeObserver.disconnect(); 
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor, initialMainCanvasDimensions]); // Added initialMainCanvasDimensions

     useEffect(() => {
       const isLoadingImages = images.some(img => !loadedHtmlImages[img.id]?.complete);
       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || isLoadingImages;

       if (shouldAnimate && !animationFrameId.current) {
         lastAnimationTime.current = performance.now();
         if (animationSettings.isSpinning && animationSettings.spinDirectionChangeFrequency > 0 && lastSpinDirectionChangeTime.current === 0) {
            lastSpinDirectionChangeTime.current = performance.now();
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
         renderCanvas(); 
       } else if (!animationFrameId.current) { 
         renderCanvas();
       }

       return () => {
         if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
         }
       };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [paths, images, texts, loadedHtmlImages, symmetrySettings, animationSettings, drawingTools, textSettings, isDrawing, currentPath, backgroundColor, shapeSettings, selectedImageId, isFillModeActive, canvasViewTransform, initialWorldCenter, initialMainCanvasDimensions]);


    const canvasCursor = isPanning ? 'grabbing' : (isFillModeActive ? 'copy' : (isDraggingImage ? 'grabbing' : (shapeSettings.currentShape === 'text' ? 'text' : 'crosshair')));

    return (
      <canvas
        ref={internalCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing} 
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        onWheel={handleWheel} 
        className="h-full w-full touch-none bg-transparent" 
        style={{ cursor: canvasCursor }}
        data-ai-hint="abstract art images text"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

