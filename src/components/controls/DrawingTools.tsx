
"use client";

import type { DrawingTools } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { PaintBucket } from "lucide-react";

interface DrawingToolControlProps {
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
  isFillModeActive: boolean;
  onToggleFillMode: () => void;
}

export function DrawingToolControl({ tools, onToolsChange, isFillModeActive, onToggleFillMode }: DrawingToolControlProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Drawing Tools</h2>
      <div className="space-y-3">
        <Label htmlFor="strokeColor" className="text-sm">Stroke Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="strokeColor"
            type="color"
            value={tools.strokeColor}
            onChange={(e) => onToolsChange({ ...tools, strokeColor: e.target.value })}
            className="h-10 w-16 p-1"
          />
          <Input
            type="text"
            value={tools.strokeColor}
            onChange={(e) => onToolsChange({ ...tools, strokeColor: e.target.value })}
            className="h-10 flex-grow"
            aria-label="Stroke color hex value"
          />
        </div>
        <p className="text-xs text-muted-foreground">Choose the color for your strokes.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Label htmlFor="fillColorInput" className="text-sm">Fill Color</Label>
            <Button
                variant={isFillModeActive ? "secondary" : "outline"}
                size="sm"
                onClick={onToggleFillMode}
                className="px-2.5" // Adjusted padding for better fit
            >
                <PaintBucket className="mr-1.5 h-4 w-4" />
                {isFillModeActive ? "Fill Active" : "Activate Fill"}
            </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="fillColorInput"
            type="color"
            value={tools.fillColor}
            onChange={(e) => onToolsChange({ ...tools, fillColor: e.target.value })}
            className="h-10 w-16 p-1"
          />
          <Input
            type="text"
            value={tools.fillColor}
            onChange={(e) => onToolsChange({ ...tools, fillColor: e.target.value })}
            className="h-10 flex-grow"
            aria-label="Fill color hex value"
          />
        </div>
        <p className="text-xs text-muted-foreground">
            {isFillModeActive
                ? "Fill mode is active. Click shapes on canvas to fill with this color."
                : "Activate fill mode (button above) to use this color for filling shapes."}
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="lineWidth" className="text-sm">Line Width ({tools.lineWidth}px)</Label>
        <Slider
          id="lineWidth"
          min={1}
          max={50}
          step={1}
          value={[tools.lineWidth]}
          onValueChange={(value) => onToolsChange({ ...tools, lineWidth: value[0] })}
        />
        <p className="text-xs text-muted-foreground">Adjust the thickness of your drawing lines.</p>
      </div>
      <div className="space-y-3">
        <Label htmlFor="backgroundColor" className="text-sm">Background Color</Label>
         <div className="flex items-center gap-2">
          <Input
            id="backgroundColor"
            type="color"
            value={tools.backgroundColor}
            onChange={(e) => onToolsChange({ ...tools, backgroundColor: e.target.value })}
            className="h-10 w-16 p-1"
          />
          <Input
            type="text"
            value={tools.backgroundColor}
            onChange={(e) => onToolsChange({ ...tools, backgroundColor: e.target.value })}
            className="h-10 flex-grow"
            aria-label="Background color hex value"
          />
        </div>
        <p className="text-xs text-muted-foreground">Set the canvas background color.</p>
      </div>
    </div>
  );
}
