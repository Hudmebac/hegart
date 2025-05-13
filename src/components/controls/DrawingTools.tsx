
"use client";

import type { DrawingTools } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface DrawingToolControlProps {
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
}

export function DrawingToolControl({ tools, onToolsChange }: DrawingToolControlProps) {
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
        <Label htmlFor="fillColor" className="text-sm">Fill Color</Label>
        <div className="flex items-center gap-2">
          <Input
            id="fillColor"
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
        <p className="text-xs text-muted-foreground">Select color to fill shapes. Activate Fill Tool and click a shape.</p>
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
