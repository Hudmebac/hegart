
"use client";

import type { Point, Path, CanvasImage, CanvasText } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings, TextSettings } from "@/components/AppClient";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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
}

// Helper to transform a point based on symmetry settings
const transformSymmetricPoint = (
    p: Point,
    centerX: number,
    centerY: number,
    baseAngle: number,
    mirrorTargetWidth: number, 
    mirrorTargetHeight: number, 
    applyMirrorX: boolean,
    applyMirrorY: boolean,
    isRotationalContext: boolean
): Point => {
    let { x, y } = p;

    if (applyMirrorX) x = mirrorTargetWidth - x;
    if (applyMirrorY) y = mirrorTargetHeight - y;
    
    if (isRotationalContext) {
        const translatedX = x - centerX;
        const translatedY = y - centerY;
        const cosA = Math.cos(baseAngle);
        const sinA = Math.sin(baseAngle);
        const rotatedX = translatedX * cosA - translatedY * sinA;
        const rotatedY = translatedX * sinA + translatedY * cosA;
        x = rotatedX + centerX;
        y = rotatedY + centerY;
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
  }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    useImperativeHandle(ref, () => internalCanvasRef.current!);

    const [isDrawing, setIsDrawing] = useState(false);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const dragStartPointRef = useRef<{ x: number, y: number } | null>(null);
    const imageStartPosRef = useRef<{ x: number, y: number } | null>(null);
    
    const animationFrameId = useRef<number | null>(null);
    const lastAnimationTime = useRef<number>(0);
    const globalPulseOffset = useRef<number>(0); 
    const totalRotation = useRef<number>(0);
    const spinDirection = useRef<number>(1);
    const lastSpinDirectionChangeTime = useRef<number>(0);

    const [loadedHtmlImages, setLoadedHtmlImages] = useState<Record<string, HTMLImageElement>>({});

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


    const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent): Point | null => {
      if (!internalCanvasRef.current) return null;
      const canvas = internalCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let x, y;
      if ('touches' in event) {
         if (event.touches.length === 0) return null;
         x = event.touches[0].clientX - rect.left;
         y = event.touches[0].clientY - rect.top;
       } else {
         x = event.clientX - rect.left;
         y = event.clientY - rect.top;
       }
      x = Math.max(0, Math.min(x, canvas.width));
      y = Math.max(0, Math.min(y, canvas.height));
      return { x, y };
    };

    const handleFillAttempt = (clickPoint: Point) => {
        if (!internalCanvasRef.current) return;
        const canvas = internalCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let filledPathIndex = -1;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        for (let i = paths.length - 1; i >= 0; i--) {
            const pathData = paths[i];
            if (pathData.points.length < 1) continue;

            if (pathData.isFixedShape) { 
                 ctx.beginPath();
                 ctx.moveTo(pathData.points[0].x, pathData.points[0].y);
                 for (let k = 1; k < pathData.points.length; k++) {
                     ctx.lineTo(pathData.points[k].x, pathData.points[k].y);
                 }
                 if (pathData.points.length > 2) ctx.closePath();
                 if (ctx.isPointInPath(clickPoint.x, clickPoint.y)) {
                     filledPathIndex = i;
                     break;
                 }
                 continue; 
            }
            
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
                    const firstTransformedPoint = transformSymmetricPoint(pathData.points[0], centerX, centerY, angle, canvas.width, canvas.height, mirror.mx, mirror.my, isRotContext);
                    ctx.moveTo(firstTransformedPoint.x, firstTransformedPoint.y);
                    for (let k = 1; k < pathData.points.length; k++) {
                        const transformedPoint = transformSymmetricPoint(pathData.points[k], centerX, centerY, angle, canvas.width, canvas.height, mirror.mx, mirror.my, isRotContext);
                        ctx.lineTo(transformedPoint.x, transformedPoint.y);
                    }
                    
                    if (pathData.points.length > 2) ctx.closePath();

                    if (ctx.isPointInPath(clickPoint.x, clickPoint.y)) {
                        filledPathIndex = i;
                        break;
                    }
                }
                if (filledPathIndex !== -1) break;
            }
            if (filledPathIndex !== -1) break;
        }

        if (filledPathIndex !== -1) {
            onFillPath(filledPathIndex, drawingTools.fillColor);
            onImageSelect(null); 
        }
    };


    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in event) event.preventDefault();
      const point = getCanvasCoordinates(event);
      if (!point) return;

      if (isFillModeActive) {
        handleFillAttempt(point);
        return; 
      }

      if (shapeSettings.currentShape === 'text') {
        if (textSettings.content.trim() === "") return; // Don't add empty text
        const newTextObject: CanvasText = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: textSettings.content,
            x: point.x,
            y: point.y,
            fontFamily: textSettings.fontFamily,
            fontSize: textSettings.fontSize,
            fontWeight: textSettings.fontWeight,
            fontStyle: textSettings.fontStyle,
            textAlign: textSettings.textAlign,
            textBaseline: textSettings.textBaseline,
            color: drawingTools.strokeColor, // Use strokeColor for text color
            isFixedShape: shapeSettings.isFixedShape,
            excludeFromAnimation: shapeSettings.excludeFromAnimation,
        };
        onTextAdd(newTextObject);
        onImageSelect(null);
        setIsDrawing(false); // Text is placed on click, no dragging to draw
        return;
      }
      
      for (let i = images.length - 1; i >= 0; i--) {
        const imgData = images[i];
        if (
          point.x >= imgData.x &&
          point.x <= imgData.x + imgData.width &&
          point.y >= imgData.y &&
          point.y <= imgData.y + imgData.height
        ) {
          onImageSelect(imgData.id);
          setIsDraggingImage(true);
          dragStartPointRef.current = point;
          imageStartPosRef.current = { x: imgData.x, y: imgData.y };
          setIsDrawing(false); 
          return;
        }
      }
      
      if (selectedImageId) {
        onImageSelect(null);
      }

      setIsDrawing(true);
      onCurrentPathChange([point]);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in event) event.preventDefault();
      if (isFillModeActive || shapeSettings.currentShape === 'text') return; 

      const point = getCanvasCoordinates(event);
      if (!point) return;

      if (isDraggingImage && selectedImageId && dragStartPointRef.current && imageStartPosRef.current) {
        const draggedImage = images.find(img => img.id === selectedImageId);
        if (draggedImage) {
          const dx = point.x - dragStartPointRef.current.x;
          const dy = point.y - dragStartPointRef.current.y;
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
          onCurrentPathChange([...currentPath, point]);
      } else {
          if (currentPath.length > 0) {
              onCurrentPathChange([currentPath[0], point]);
          }
      }
    };

    const finishDrawing = () => {
      if (isFillModeActive || shapeSettings.currentShape === 'text') return; 

      if (isDraggingImage) {
        setIsDraggingImage(false);
        dragStartPointRef.current = null;
        imageStartPosRef.current = null;
        // Here you might want to snapshot history for image drag completion
        return;
      }

      if (!isDrawing || currentPath.length === 0) return;
      setIsDrawing(false);
      let finalPathPoints: Point[];
      if (shapeSettings.currentShape !== 'freehand' && currentPath.length === 2) {
          const canvas = internalCanvasRef.current;
          if (!canvas) return;
          finalPathPoints = drawShape(shapeSettings.currentShape, currentPath[0], currentPath[1], canvas.width, canvas.height);
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

    const drawSinglePath = (
        ctx: CanvasRenderingContext2D, 
        pathPoints: Point[], 
        strokeColor: string, 
        lineWidth: number, 
        currentLineWidthOffset: number,
        fillColor?: string | null 
    ) => {
      if (pathPoints.length === 0) return;
      const effectiveLineWidth = lineWidth + currentLineWidthOffset;
      
      if (effectiveLineWidth < 0.1 && !fillColor) return;

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

      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      if (effectiveLineWidth >= 0.1) { 
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = effectiveLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    const drawTemporaryShapeLine = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number) => {
        if (path.length !== 2) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.lineTo(path[1].x, path[1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, lineWidth * 0.5); 
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    const drawSymmetricImage = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        htmlImg: HTMLImageElement,
        imgData: CanvasImage,
        currentSymmetry: SymmetrySettings,
        isSelected: boolean
     ) => {
        const { x, y, width, height } = imgData;
        const numAxes = currentSymmetry.rotationalAxes > 0 ? currentSymmetry.rotationalAxes : 1;
        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;
        const isRotContext = numAxes > 1;

        for (let i = 0; i < numAxes; i++) {
            const rotationAngle = (i * 2 * Math.PI) / numAxes;
            const mirrorsToApply = [{ mx: false, my: false }];
            if (currentSymmetry.mirrorX) mirrorsToApply.push({ mx: true, my: false });
            if (currentSymmetry.mirrorY) mirrorsToApply.push({ mx: false, my: true });
            if (currentSymmetry.mirrorX && currentSymmetry.mirrorY) mirrorsToApply.push({ mx: true, my: true });
            
            for (const mirror of mirrorsToApply) {
                ctx.save();
                if (isRotContext) {
                    ctx.translate(canvasCenterX, canvasCenterY);
                    ctx.rotate(rotationAngle);
                    ctx.translate(-canvasCenterX, -canvasCenterY);
                }
                let drawX = x;
                let drawY = y;
                let scaleX = 1;
                let scaleY = 1;
                if (mirror.mx) {
                    drawX = canvas.width - x - width; 
                    scaleX = -1;
                }
                if (mirror.my) {
                    drawY = canvas.height - y - height; 
                    scaleY = -1;
                }
                ctx.translate(drawX + (scaleX === 1 ? 0 : width), drawY + (scaleY === 1 ? 0 : height));
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(htmlImg, 0, 0, width, height);
                
                if (isSelected && i === 0 && !mirror.mx && !mirror.my) { 
                    ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
                    const globalScale = animationSettings.isScaling ? (1 + Math.sin(0) * animationSettings.scaleIntensity) : 1;
                    ctx.lineWidth = 2 / globalScale; 
                    ctx.setLineDash([4 / globalScale, 2 / globalScale]);
                    ctx.strokeRect(0 - 2, 0 - 2, width + 4, height + 4);
                    ctx.setLineDash([]);
                }
                ctx.restore();
            }
        }
     };
    
    const drawSymmetricPath = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        pathData: Path,
        currentSymmetrySettings: SymmetrySettings,
        isTemporaryShape: boolean,
        currentFramePulseOffset: number
    ) => {
        const { points: originalPoints, color, lineWidth, fillColor } = pathData;
        const drawFunc = isTemporaryShape ? drawTemporaryShapeLine : drawSinglePath;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const numAxes = currentSymmetrySettings.rotationalAxes > 0 ? currentSymmetrySettings.rotationalAxes : 1;
        const isRotContext = numAxes > 1;

        const actualLineWidthOffset = isTemporaryShape ? 0 : currentFramePulseOffset;

        for (let i = 0; i < numAxes; i++) {
           const angle = (i * 2 * Math.PI) / numAxes;
          
           const baseTransformedPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, 0,0,false,false, isRotContext));
           drawFunc(ctx, baseTransformedPath, color, lineWidth, actualLineWidthOffset, fillColor);

           if (currentSymmetrySettings.mirrorX) {
             const mirroredXPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, canvas.width, 0, true, false, isRotContext));
             drawFunc(ctx, mirroredXPath, color, lineWidth, actualLineWidthOffset, fillColor);
           }
           if (currentSymmetrySettings.mirrorY) {
             const mirroredYPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, 0, canvas.height, false, true, isRotContext));
             drawFunc(ctx, mirroredYPath, color, lineWidth, actualLineWidthOffset, fillColor);
           }
           if (currentSymmetrySettings.mirrorX && currentSymmetrySettings.mirrorY) {
               const mirroredXYPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, canvas.width, canvas.height, true, true, isRotContext));
               drawFunc(ctx, mirroredXYPath, color, lineWidth, actualLineWidthOffset, fillColor);
           }
        }
    };

    const drawSymmetricText = (
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        textData: CanvasText,
        currentSymmetrySettings: SymmetrySettings
    ) => {
        const { text, x, y, fontFamily, fontSize, fontWeight, fontStyle, color, textAlign, textBaseline } = textData;
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
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
                let transformedX = x;
                let transformedY = y;

                if (mirror.mx) transformedX = canvas.width - x;
                if (mirror.my) transformedY = canvas.height - y;

                if (isRotContext) {
                    const translatedX = transformedX - centerX;
                    const translatedY = transformedY - centerY;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);
                    transformedX = translatedX * cosA - translatedY * sinA + centerX;
                    transformedY = translatedX * sinA + translatedY * cosA + centerY;
                }
                // Note: True text content mirroring (flipping the text itself) would require ctx.scale(-1, 1) etc.
                // This implementation mirrors the text's origin point.
                ctx.fillText(text, transformedX, transformedY);
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

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

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
      ctx.translate(centerX, centerY);
      if (animationSettings.isSpinning) ctx.rotate(currentRotationAngle);
      if (animationSettings.isScaling) ctx.scale(currentScaleFactor, currentScaleFactor);
      ctx.translate(-centerX, -centerY);

      paths.forEach(pathData => {
        if (!pathData.excludeFromAnimation) {
          const pathSpecificPulseOffset = animationSettings.isPulsing ? globalPulseOffset.current : 0;
          if (pathData.isFixedShape) {
            drawSinglePath(ctx, pathData.points, pathData.color, pathData.lineWidth, pathSpecificPulseOffset, pathData.fillColor);
          } else {
            drawSymmetricPath(ctx, canvas, pathData, symmetrySettings, false, pathSpecificPulseOffset);
          }
        }
      });
      images.forEach(imgData => {
        // Assuming images are not excludable from animation for now
        const htmlImg = loadedHtmlImages[imgData.id];
        if (htmlImg && htmlImg.complete && htmlImg.naturalWidth > 0) {
          drawSymmetricImage(ctx, canvas, htmlImg, imgData, symmetrySettings, imgData.id === selectedImageId);
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
                drawSymmetricText(ctx, canvas, textData, symmetrySettings);
            }
        }
      });
      ctx.restore(); 

      paths.forEach(pathData => {
        if (pathData.excludeFromAnimation) {
          const staticLineWidthOffset = 0; 
          if (pathData.isFixedShape) {
            drawSinglePath(ctx, pathData.points, pathData.color, pathData.lineWidth, staticLineWidthOffset, pathData.fillColor);
          } else {
            drawSymmetricPath(ctx, canvas, pathData, symmetrySettings, false, staticLineWidthOffset);
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
                // Symmetry still applies for excluded from animation if not fixed
                drawSymmetricText(ctx, canvas, textData, symmetrySettings);
            }
        }
      });
      
      if (isDrawing && currentPath.length > 0 && !isFillModeActive && shapeSettings.currentShape !== 'text') {
          const isShapePreviewLine = shapeSettings.currentShape !== 'freehand';
          const tempPreviewPath: Path = {
              points: currentPath,
              color: drawingTools.strokeColor,
              lineWidth: drawingTools.lineWidth,
              isFixedShape: shapeSettings.isFixedShape,
              excludeFromAnimation: shapeSettings.excludeFromAnimation
          };

          const previewPulseOffset = isShapePreviewLine ? 0 
                                     : (animationSettings.isPulsing && !tempPreviewPath.excludeFromAnimation) ? globalPulseOffset.current
                                     : 0;

          if (tempPreviewPath.isFixedShape) {
              const drawFunc = isShapePreviewLine ? drawTemporaryShapeLine : drawSinglePath;
              drawFunc(ctx, tempPreviewPath.points, tempPreviewPath.color, tempPreviewPath.lineWidth, previewPulseOffset, tempPreviewPath.fillColor);
          } else {
              drawSymmetricPath(ctx, canvas, tempPreviewPath, symmetrySettings, isShapePreviewLine, previewPulseOffset);
          }
      }
      
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
    }, [backgroundColor]); 

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
     }, [paths, images, texts, loadedHtmlImages, symmetrySettings, animationSettings, drawingTools, textSettings, isDrawing, currentPath, backgroundColor, shapeSettings, selectedImageId, isFillModeActive]);


    const canvasCursor = isFillModeActive ? 'copy' : (isDraggingImage ? 'grabbing' : (shapeSettings.currentShape === 'text' ? 'text' : 'crosshair'));

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
        className="h-full w-full touch-none bg-transparent"
        style={{ cursor: canvasCursor }}
        data-ai-hint="abstract art images text"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

