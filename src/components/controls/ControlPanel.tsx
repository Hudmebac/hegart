
"use client";

import type { Point, Path, CanvasImage } from "@/types/drawing"; // Added CanvasImage
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings } from "@/components/AppClient";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SymmetryControl } from "./SymmetrySettings";
import { AnimationControl } from "./AnimationSettings";
import { DrawingToolControl } from "./DrawingTools";
import { ShapeControl } from "./ShapeSettings";
import { ActionToolbar } from "./ActionToolbar";
import { PreviewCanvas } from "../canvas/PreviewCanvas";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DraftingCompass, ZoomIn, Image as ImageIcon, Upload } from "lucide-react";

interface ControlPanelProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
  shapes: ShapeSettings;
  onShapesChange: (settings: ShapeSettings) => void;
  activePath: Point[];
  completedPaths: Path[];
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
  mainCanvasDimensions: { width: number, height: number };
  onImageUpload: (file: File) => void; // New prop for image upload
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
  mainCanvasDimensions,
  onImageUpload, // Destructure new prop
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
             <div className="aspect-video w-full bg-muted rounded-md border border-input overflow-hidden">
                <PreviewCanvas
                  completedPaths={completedPaths}
                  drawingTools={tools}
                  mainCanvasDimensions={mainCanvasDimensions}
                />
             </div>
              <p className="text-xs text-muted-foreground mt-1">
                Shows current drawing. Pan (drag) and zoom (scroll). Uploaded images are not shown here.
              </p>
          </CardContent>
        </Card>

        <Separator />

        <ActionToolbar
          onClear={onClear}
          onSave={onSave}
          onUndo={onUndo}
          canUndo={canUndo}
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
                  accept="image/*,.heic,.heif" // Added HEIC/HEIF common mobile formats
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onImageUpload(e.target.files[0]);
                      e.target.value = ''; // Reset file input to allow uploading same file again
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
