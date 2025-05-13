
"use client";

import type { Point, Path, CanvasImage } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings } from "@/components/AppClient";
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { drawShape } from './shapeUtils';

interface DrawingCanvasProps {
  paths: Path[];
  images: CanvasImage[];
  currentPath: Point[];
  onCurrentPathChange: (path: Point[]) => void;
  onPathAdd: (path: Path) => void;
  onFillPath: (pathIndex: number, fillColor: string) => void; // New prop for fill
  symmetrySettings: SymmetrySettings;
  animationSettings: AnimationSettings;
  drawingTools: DrawingTools;
  shapeSettings: ShapeSettings;
  backgroundColor: string;
  selectedImageId: string | null;
  onImageSelect: (id: string | null) => void;
  onImageUpdate: (updatedImage: CanvasImage) => void;
  isFillModeActive: boolean; // New prop
}

// Helper to check if a path is reasonably "closed" for freehand filling
const isPathClosedGeometric = (points: Point[], threshold: number = 15): boolean => {
    if (points.length < 3) return false;
    const first = points[0];
    const last = points[points.length - 1];
    return Math.hypot(last.x - first.x, last.y - first.y) < threshold;
};

// Helper function to transform a point based on symmetry settings
const transformSymmetricPoint = (
    p: Point,
    centerX: number,
    centerY: number,
    baseAngle: number,
    mirrorTargetWidth: number, // canvas.width if mirroring X, else 0 or original x
    mirrorTargetHeight: number, // canvas.height if mirroring Y, else 0 or original y
    applyMirrorX: boolean,
    applyMirrorY: boolean,
    isRotationalContext: boolean
): Point => {
    let { x, y } = p;

    // 1. Apply mirroring if specified (mirrors are relative to original untransformed space)
    if (applyMirrorX) x = mirrorTargetWidth - x;
    if (applyMirrorY) y = mirrorTargetHeight - y;
    
    // 2. Apply rotation if in a rotational context
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
    currentPath,
    onCurrentPathChange,
    onPathAdd,
    onFillPath,
    symmetrySettings,
    animationSettings,
    drawingTools,
    shapeSettings,
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
        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;

        // Check paths from top-most (last drawn) to bottom-most
        for (let i = paths.length - 1; i >= 0; i--) {
            const pathData = paths[i];
            if (pathData.points.length < 1) continue; // Need points to define a path

            // Test against all symmetric instances of this path
            for (let axisIdx = 0; axisIdx < numAxes; axisIdx++) {
                const angle = (axisIdx * 2 * Math.PI) / numAxes;
                const isRotContext = numAxes > 1;

                const mirrorsToTest = [
                    { mx: false, my: false }, // Original
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
                    
                    // Close the path for an accurate area check, especially for non-freehand shapes or closed freehand
                    // shapeType is not directly available here, so we rely on point structure or freehand check.
                    if (pathData.points.length > 2) { // Only close if it can form a polygon
                        ctx.closePath();
                    }

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
            onImageSelect(null); // Deselect any image if a fill occurs
        }
    };


    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in event) event.preventDefault();
      const point = getCanvasCoordinates(event);
      if (!point) return;

      if (isFillModeActive) {
        handleFillAttempt(point);
        return; // Do not proceed with drawing or image dragging
      }

      // Check if clicking on an image (only if not in fill mode)
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
      if (isFillModeActive) return; // No drawing/dragging if fill mode is active

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
      if (isFillModeActive) return; 

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
          const canvas = internalCanvasRef.current;
          if (!canvas) return;
          finalPathPoints = drawShape(shapeSettings.currentShape, currentPath[0], currentPath[1], canvas.width, canvas.height);
      } else {
          finalPathPoints = currentPath;
      }
       if (finalPathPoints.length >= (shapeSettings.currentShape === 'line' || shapeSettings.currentShape === 'arrow' || shapeSettings.currentShape === 'checkMark' ? 2 : 1)) { // Lines need 2 points, fillable shapes could be 1 for some interpretations
          onPathAdd({
            points: finalPathPoints,
            color: drawingTools.strokeColor,
            lineWidth: drawingTools.lineWidth,
            // fillColor is not set here, it's set by onFillPath
          });
       }
      onCurrentPathChange([]);
    };

    const drawSinglePath = (
        ctx: CanvasRenderingContext2D, 
        pathPoints: Point[], 
        strokeColor: string, 
        lineWidth: number, 
        currentLineWidthOffset: number = 0,
        fillColor?: string | null // Added fillColor
    ) => {
      if (pathPoints.length === 0) return;
      const effectiveLineWidth = lineWidth + currentLineWidthOffset;
      
      // Do not draw if line is too thin AND there's no fill color
      if (effectiveLineWidth < 0.1 && !fillColor) return;

      ctx.beginPath();
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      
      // For fillable shapes (not lines/arrows typically), close the path.
      // This ensures `ctx.fill()` works as expected for areas.
      // For freehand, fill() auto-closes. For defined shapes, they should form a closed loop if fillable.
      // A simple heuristic: if it's not a "line-like" shape and has enough points, close it.
      // This logic could be tied to `shapeSettings.currentShape` if available here, or rely on point structure.
      if (pathPoints.length > 2 && shapeSettings.currentShape !== 'line' && shapeSettings.currentShape !== 'arrow' && shapeSettings.currentShape !== 'checkMark') {
           ctx.closePath(); 
      }


      if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      if (effectiveLineWidth >= 0.1) { // Only stroke if line width is positive
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
        currentSymmetry: SymmetrySettings, // Use currentSymmetry passed in
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
            
            // Deduplicate mirror configurations if rotational symmetry already covers them (e.g. 2 axes with mirrorX is redundant)
            // This is complex; for now, let's allow redundant drawing which is visually fine.
            
            for (const mirror of mirrorsToApply) {
                ctx.save();
                // Apply rotation first for rotational symmetry
                if (isRotContext) {
                    ctx.translate(canvasCenterX, canvasCenterY);
                    ctx.rotate(rotationAngle);
                    ctx.translate(-canvasCenterX, -canvasCenterY);
                }

                // Then apply mirroring transformations relative to the (potentially rotated) canvas space
                let drawX = x;
                let drawY = y;
                let scaleX = 1;
                let scaleY = 1;

                if (mirror.mx) {
                    drawX = canvas.width - x - width; // Adjust anchor for mirrored drawing
                    scaleX = -1;
                }
                if (mirror.my) {
                    drawY = canvas.height - y - height; // Adjust anchor for mirrored drawing
                    scaleY = -1;
                }
                
                ctx.translate(drawX + (scaleX === 1 ? 0 : width), drawY + (scaleY === 1 ? 0 : height));
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(htmlImg, 0, 0, width, height);
                
                // Selection highlight on the primary, non-mirrored, non-rotated instance
                if (isSelected && i === 0 && !mirror.mx && !mirror.my) {
                    ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
                    // Adjust lineWidth for current global scale transformation if any
                    const globalScale = animationSettings.isScaling ? (1 + Math.sin(0) * animationSettings.scaleIntensity) : 1; // Placeholder time for sin
                    ctx.lineWidth = 2 / globalScale; 
                    ctx.setLineDash([4 / globalScale, 2 / globalScale]);
                    // Stroke rect in original image's coordinate system before mirror/rotation of this specific draw call
                    ctx.strokeRect(0 - 2, 0 - 2, width + 4, height + 4);
                    ctx.setLineDash([]);
                }
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

      let currentLineWidthOffset = 0;
       if (animationSettings.isPulsing) {
         const pulseCycle = (time / (1000 / (animationSettings.pulseSpeed / 2))) % (2 * Math.PI);
         currentLineWidthOffset = Math.cos(pulseCycle) * animationSettings.pulseIntensity;
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
            lastSpinDirectionChangeTime.current = 0; // Reset when not spinning
       }
       const currentRotationAngle = totalRotation.current;

      ctx.save(); 
      ctx.translate(centerX, centerY);
      if (animationSettings.isSpinning) ctx.rotate(currentRotationAngle);
      if (animationSettings.isScaling) ctx.scale(currentScaleFactor, currentScaleFactor);
      ctx.translate(-centerX, -centerY);

      images.forEach(imgData => {
        const htmlImg = loadedHtmlImages[imgData.id];
        if (htmlImg && htmlImg.complete && htmlImg.naturalWidth > 0) {
          // Pass symmetrySettings directly to drawSymmetricImage
          drawSymmetricImage(ctx, canvas, htmlImg, imgData, symmetrySettings, imgData.id === selectedImageId);
        }
      });

      const drawSymmetricPath = (originalPathData: Path, isTemporaryShape = false) => {
        const { points: originalPoints, color, lineWidth, fillColor } = originalPathData;
        const drawFunc = isTemporaryShape ? drawTemporaryShapeLine : drawSinglePath;
        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;
        const isRotContext = numAxes > 1;

        for (let i = 0; i < numAxes; i++) {
           const angle = (i * 2 * Math.PI) / numAxes;
          
           // Base (no mirror)
           const baseTransformedPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, 0,0,false,false, isRotContext));
           drawFunc(ctx, baseTransformedPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset, fillColor);

           if (symmetrySettings.mirrorX) {
             const mirroredXPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, canvas.width, 0, true, false, isRotContext));
             drawFunc(ctx, mirroredXPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset, fillColor);
           }
           if (symmetrySettings.mirrorY) {
             const mirroredYPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, 0, canvas.height, false, true, isRotContext));
             drawFunc(ctx, mirroredYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset, fillColor);
           }
           if (symmetrySettings.mirrorX && symmetrySettings.mirrorY) {
               const mirroredXYPath = originalPoints.map(p => transformSymmetricPoint(p, centerX, centerY, angle, canvas.width, canvas.height, true, true, isRotContext));
               drawFunc(ctx, mirroredXYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset, fillColor);
           }
        }
      };
      paths.forEach(pathData => drawSymmetricPath(pathData));
      if (isDrawing && currentPath.length > 0 && !isFillModeActive) {
          const isShapePreview = shapeSettings.currentShape !== 'freehand';
          // Create a temporary Path-like object for the current drawing
          const currentDrawingPath = {
              points: currentPath,
              color: drawingTools.strokeColor,
              lineWidth: drawingTools.lineWidth,
              // No fillColor for current path preview usually, unless we add that feature
          };
          drawSymmetricPath(currentDrawingPath, isShapePreview);
      }
      
      ctx.restore(); 

      if (animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || images.some(img => !loadedHtmlImages[img.id]?.complete)) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null;
        if (!animationSettings.isSpinning) { // Ensure reset if spinning stops
          totalRotation.current = 0;
          // spinDirection can remain as is
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
       renderCanvas(); 
       const isLoadingImages = images.some(img => !loadedHtmlImages[img.id]?.complete);
       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || isLoadingImages;

       if (shouldAnimate && !animationFrameId.current) {
         lastAnimationTime.current = performance.now();
         if (animationSettings.isSpinning && animationSettings.spinDirectionChangeFrequency > 0 && lastSpinDirectionChangeTime.current === 0) {
            lastSpinDirectionChangeTime.current = performance.now();
         } else if (!animationSettings.isSpinning) {
            totalRotation.current = 0; // Reset rotation if spinning is turned off
            // spinDirection can persist
            lastSpinDirectionChangeTime.current = 0; // Reset this too
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
         if (!animationSettings.isSpinning) { // Ensure reset values are applied if animation stops
            totalRotation.current = 0;
            lastSpinDirectionChangeTime.current = 0;
         }
         renderCanvas(); 
       }
       if (!animationFrameId.current) renderCanvas();


       return () => {
         if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
         }
       };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [paths, images, loadedHtmlImages, symmetrySettings, animationSettings, drawingTools, isDrawing, currentPath, backgroundColor, shapeSettings, selectedImageId, isFillModeActive]);


    const canvasCursor = isFillModeActive ? 'copy' : (isDraggingImage ? 'grabbing' : 'crosshair');

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
        data-ai-hint="abstract art images"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
