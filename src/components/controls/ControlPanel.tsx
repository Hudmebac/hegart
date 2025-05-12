
"use client";

import type { Point } from "@/types/drawing";
import type { SymmetrySettings, AnimationSettings, DrawingTools, ShapeSettings } from "@/components/AppClient";
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

interface ControlPanelProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
  shapes: ShapeSettings;
  onShapesChange: (settings: ShapeSettings) => void;
  currentPath: Point[];
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void;
  canUndo: boolean;
  mainCanvasDimensions: { width: number, height: number }; // Added prop
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
  currentPath,
  onClear,
  onSave,
  onUndo,
  canUndo,
  mainCanvasDimensions, // Destructure new prop
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
                  currentPath={currentPath}
                  drawingTools={tools}
                  mainCanvasDimensions={mainCanvasDimensions} // Pass prop
                />
             </div>
              <p className="text-xs text-muted-foreground mt-2">Shows your raw stroke. You can pan (drag) and zoom (scroll).</p>
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
