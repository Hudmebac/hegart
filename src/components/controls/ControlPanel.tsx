
"use client";

import type { Point, Path, CanvasImage, ShapeType } from "@/types/drawing"; 
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings as AppShapeSettings } from "@/components/AppClient"; // Use AppShapeSettings to avoid conflict
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SymmetryControl } from "./SymmetrySettings";
import { AnimationControl } from "./AnimationSettings";
import { DrawingToolControl } from "./DrawingTools";
import { ShapeControl } from "./ShapeSettings"; // ShapeControl will internally use ShapeType
import { ActionToolbar } from "./ActionToolbar";
import { PreviewCanvas } from "../canvas/PreviewCanvas";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, Image as ImageIcon, Upload } from "lucide-react";

interface ControlPanelProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
  shapes: AppShapeSettings; // Use aliased ShapeSettings from AppClient
  onShapesChange: (settings: AppShapeSettings) => void;
  activePath: Point[];
  completedPaths: Path[];
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onResetSettings: () => void; // New prop for reset
  mainCanvasDimensions: { width: number, height: number };
  onImageUpload: (file: File) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function ControlPanel({
  symmetry,
  onSymmetryChange,
  animation,
  onAnimationChange,
  tools,
  onToolsChange,
  shapes,
  onShapesChange,
  activePath,
  completedPaths,
  onClear,
  onSave,
  onUndo,
  canUndo,
  onResetSettings,
  mainCanvasDimensions,
  onImageUpload,
  isRecording,
  onStartRecording,
  onStopRecording,
}: ControlPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-4 space-y-6">
        <Card>
          <CardHeader className="p-3 pb-1">
             <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ZoomIn className="h-5 w-5" />
                Drawing Preview
             </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             {/* Removed overflow-hidden to allow maximized preview to break out */}
             <div className="aspect-video w-full bg-muted rounded-md border border-input relative">
                <PreviewCanvas
                  completedPaths={completedPaths}
                  drawingTools={tools}
                  mainCanvasDimensions={mainCanvasDimensions}
                />
             </div>
          </CardContent>
        </Card>

        <Separator />

        <ActionToolbar
          onClear={onClear}
          onSave={onSave}
          onUndo={onUndo}
          canUndo={canUndo}
          onResetSettings={onResetSettings}
          isRecording={isRecording}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
        <Separator />
        <Accordion
          type="multiple"
          defaultValue={["shapes", "drawing-tools", "image-controls", "symmetry", "animation"]}
          className="w-full"
        >
          <ShapeControl shapes={shapes} onShapesChange={onShapesChange} />
          <DrawingToolControl tools={tools} onToolsChange={onToolsChange} />
          
          <AccordionItem value="image-controls">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Image Controls
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*,.heic,.heif" 
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onImageUpload(e.target.files[0]);
                      e.target.value = ''; 
                    }
                  }}
                />
                <Button asChild variant="outline" className="w-full">
                  <Label htmlFor="imageUpload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" /> Select Image File
                  </Label>
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Upload an image to add it to the canvas.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <SymmetryControl symmetry={symmetry} onSymmetryChange={onSymmetryChange} />
          <AnimationControl animation={animation} onAnimationChange={onAnimationChange} />
        </Accordion>
      </div>
    </ScrollArea>
  );
}
