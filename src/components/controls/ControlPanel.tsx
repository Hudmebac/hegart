
"use client";

import type { Point, Path } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings, PreviewMode } from "@/components/AppClient";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SymmetryControl } from "./SymmetrySettings";
import { AnimationControl } from "./AnimationSettings";
import { DrawingToolControl } from "./DrawingTools";
import { ShapeControl } from "./ShapeSettings";
import { ActionToolbar } from "./ActionToolbar";
import { PreviewCanvas } from "../canvas/PreviewCanvas";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DraftingCompass } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ControlPanelProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
  shapes: ShapeSettings;
  onShapesChange: (settings: ShapeSettings) => void;
  activePath: Point[]; // Renamed from currentPath for clarity
  completedPaths: Path[]; // New prop for all completed paths
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
  mainCanvasDimensions: { width: number, height: number };
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
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
  activePath, // Use new prop name
  completedPaths, // Use new prop
  onClear,
  onSave,
  onUndo,
  canUndo,
  mainCanvasDimensions,
  previewMode,
  onPreviewModeChange,
}: ControlPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-4 space-y-6">
        <Card>
          <CardHeader className="p-3 pb-1">
             <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DraftingCompass className="h-5 w-5" />
                Stroke Preview
             </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
             <div className="aspect-video w-full bg-muted rounded-md border border-input overflow-hidden">
                <PreviewCanvas
                  activePath={activePath}
                  completedPaths={completedPaths}
                  drawingTools={tools}
                  mainCanvasDimensions={mainCanvasDimensions}
                  previewMode={previewMode}
                />
             </div>
             <RadioGroup
                value={previewMode}
                onValueChange={(value) => onPreviewModeChange(value as PreviewMode)}
                className="flex gap-4 mt-2"
             >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stroke" id="preview-stroke" />
                  <Label htmlFor="preview-stroke" className="text-xs font-normal cursor-pointer">Stroke</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="userDrawn" id="preview-userDrawn" />
                  <Label htmlFor="preview-userDrawn" className="text-xs font-normal cursor-pointer">User Drawn</Label>
                </div>
             </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1">
                {previewMode === 'userDrawn'
                  ? "Shows all strokes. Pan (drag) and zoom (scroll)."
                  : "Shows current tool or active stroke."}
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
          defaultValue={["shapes", "drawing-tools", "symmetry", "animation"]}
          className="w-full"
        >
          <ShapeControl shapes={shapes} onShapesChange={onShapesChange} />
          <DrawingToolControl tools={tools} onToolsChange={onToolsChange} />
          <SymmetryControl symmetry={symmetry} onSymmetryChange={onSymmetryChange} />
          <AnimationControl animation={animation} onAnimationChange={onAnimationChange} />
        </Accordion>
      </div>
    </ScrollArea>
  );
}
