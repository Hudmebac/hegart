
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
  symmetrySettings: SymmetrySettings;
  animationSettings: AnimationSettings;
  drawingTools: DrawingTools;
  shapeSettings: ShapeSettings;
  backgroundColor: string;
  selectedImageId: string | null;
  onImageSelect: (id: string | null) => void;
  onImageUpdate: (updatedImage: CanvasImage) => void;
}

export const DrawingCanvas = forwardRef<HTMLCanvasElement, DrawingCanvasProps>(
  ({
    paths,
    images,
    currentPath,
    onCurrentPathChange,
    onPathAdd,
    symmetrySettings,
    animationSettings,
    drawingTools,
    shapeSettings,
    backgroundColor,
    selectedImageId,
    onImageSelect,
    onImageUpdate,
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

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in event) event.preventDefault();
      const point = getCanvasCoordinates(event);
      if (!point) return;

      // Check if clicking on an image
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
          setIsDrawing(false); // Don't start drawing paths
          return;
        }
      }
      
      // If not clicking on an image, deselect any selected image
      if (selectedImageId) {
        onImageSelect(null);
      }

      setIsDrawing(true);
      onCurrentPathChange([point]);
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if ('touches' in event) event.preventDefault();
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
      if (isDraggingImage) {
        setIsDraggingImage(false);
        dragStartPointRef.current = null;
        imageStartPosRef.current = null;
        // Image remains selected
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
       if (finalPathPoints.length >= 2) {
          onPathAdd({
            points: finalPathPoints,
            color: drawingTools.strokeColor,
            lineWidth: drawingTools.lineWidth,
          });
       }
      onCurrentPathChange([]);
    };

    const drawSinglePath = (ctx: CanvasRenderingContext2D, path: Point[], color: string, lineWidth: number, currentLineWidthOffset: number = 0) => {
      if (path.length < 2) return;
      const effectiveLineWidth = lineWidth + currentLineWidthOffset;
      if (effectiveLineWidth < 0.1) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.strokeStyle = color;
      ctx.lineWidth = effectiveLineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
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
        symmetry: SymmetrySettings,
        isSelected: boolean
     ) => {
        const { x, y, width, height } = imgData;
        const numAxes = symmetry.rotationalAxes > 0 ? symmetry.rotationalAxes : 1;
        const canvasCenterX = canvas.width / 2;
        const canvasCenterY = canvas.height / 2;

        for (let i = 0; i < numAxes; i++) {
            const rotationAngle = (i * 2 * Math.PI) / numAxes;

            const applyTransformAndDraw = (currentX: number, currentY: number, scaleX: number = 1, scaleY: number = 1) => {
                ctx.save();
                ctx.translate(canvasCenterX, canvasCenterY);
                ctx.rotate(rotationAngle);
                ctx.translate(-canvasCenterX, -canvasCenterY);

                ctx.translate(currentX + width / 2, currentY + height / 2);
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(htmlImg, -width / 2, -height / 2, width, height);
                
                if (isSelected && i === 0 && scaleX === 1 && scaleY === 1) { // Draw selection only on the primary, non-mirrored image
                    ctx.strokeStyle = 'rgba(0, 128, 255, 0.8)';
                    ctx.lineWidth = 2 / (animationSettings.isScaling ? (1 + Math.sin(0) * animationSettings.scaleIntensity) : 1); // Adjust for global scale
                    ctx.setLineDash([4, 2]);
                    ctx.strokeRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
                    ctx.setLineDash([]);
                }
                ctx.restore();
            };

            applyTransformAndDraw(x, y); 

            if (symmetry.mirrorX) {
                applyTransformAndDraw(canvas.width - x - width, y, -1, 1);
            }
            if (symmetry.mirrorY) {
                applyTransformAndDraw(x, canvas.height - y - height, 1, -1);
            }
            if (symmetry.mirrorX && symmetry.mirrorY) {
                applyTransformAndDraw(canvas.width - x - width, canvas.height - y - height, -1, -1);
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
            lastSpinDirectionChangeTime.current = 0;
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
          drawSymmetricImage(ctx, canvas, htmlImg, imgData, symmetrySettings, imgData.id === selectedImageId);
        }
      });

      const drawSymmetricPath = (originalPathData: Path | { points: Point[], color: string, lineWidth: number }, isTemporaryShape = false) => {
        const { points: originalPoints, color, lineWidth } = originalPathData;
        const drawFunc = isTemporaryShape ? drawTemporaryShapeLine : drawSinglePath;
        const numAxes = symmetrySettings.rotationalAxes > 0 ? symmetrySettings.rotationalAxes : 1;

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
          const baseTransformedPath = originalPoints.map(transformPoint);
          drawFunc(ctx, baseTransformedPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);

           if (symmetrySettings.mirrorX) {
             const mirroredXPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: p.y}));
              drawFunc(ctx, mirroredXPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorY) {
             const mirroredYPath = baseTransformedPath.map(p => ({x: p.x, y: canvas.height - p.y}));
              drawFunc(ctx, mirroredYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
           if (symmetrySettings.mirrorX && symmetrySettings.mirrorY) {
               const mirroredXYPath = baseTransformedPath.map(p => ({x: canvas.width - p.x, y: canvas.height - p.y}));
              drawFunc(ctx, mirroredXYPath, color, lineWidth, isTemporaryShape ? 0 : currentLineWidthOffset);
           }
        }
      };
      paths.forEach(pathData => drawSymmetricPath(pathData));
      if (isDrawing && currentPath.length > 0) {
          const isShapePreview = shapeSettings.currentShape !== 'freehand';
          drawSymmetricPath({
              points: currentPath,
              color: drawingTools.strokeColor,
              lineWidth: drawingTools.lineWidth,
          }, isShapePreview);
      }
      
      ctx.restore(); 

      if (animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || images.some(img => !loadedHtmlImages[img.id]?.complete)) {
        animationFrameId.current = requestAnimationFrame(renderCanvas);
      } else {
        animationFrameId.current = null;
        if (!animationSettings.isSpinning) {
          totalRotation.current = 0;
          spinDirection.current = 1;
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
    }, [backgroundColor]); // Only re-run if background color changes for initial setup

     useEffect(() => {
       renderCanvas(); 
       const isLoadingImages = images.some(img => !loadedHtmlImages[img.id]?.complete);
       const shouldAnimate = animationSettings.isPulsing || animationSettings.isScaling || animationSettings.isSpinning || isLoadingImages;

       if (shouldAnimate && !animationFrameId.current) {
         lastAnimationTime.current = performance.now();
         if (animationSettings.isSpinning && animationSettings.spinDirectionChangeFrequency > 0) {
            lastSpinDirectionChangeTime.current = performance.now();
         } else if (!animationSettings.isSpinning) {
            totalRotation.current = 0;
            spinDirection.current = 1;
            lastSpinDirectionChangeTime.current = 0;
         }
         animationFrameId.current = requestAnimationFrame(renderCanvas);
       } else if (!shouldAnimate && animationFrameId.current) {
         cancelAnimationFrame(animationFrameId.current);
         animationFrameId.current = null;
         totalRotation.current = 0;
         spinDirection.current = 1;
         lastSpinDirectionChangeTime.current = 0;
         renderCanvas(); // Render one last time to clear animation artifacts
       }
       // Ensure canvas re-renders when selectedImageId changes to show/hide selection highlight
       if (!animationFrameId.current) renderCanvas();


       return () => {
         if (animationFrameId.current) {
           cancelAnimationFrame(animationFrameId.current);
           animationFrameId.current = null;
         }
       };
     // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [paths, images, loadedHtmlImages, symmetrySettings, animationSettings, drawingTools, isDrawing, currentPath, backgroundColor, shapeSettings, selectedImageId]);


    return (
      <canvas
        ref={internalCanvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing} // Important for when mouse leaves canvas while dragging image or drawing
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={finishDrawing}
        className="h-full w-full touch-none bg-transparent cursor-crosshair"
        data-ai-hint="abstract art images"
      />
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";

