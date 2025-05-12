"use client";

import type { DrawingTools } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Palette } from "lucide-react";

interface DrawingToolControlProps {
  tools: DrawingTools;
  onToolsChange: (settings: DrawingTools) => void;
}

export function DrawingToolControl({ tools, onToolsChange }: DrawingToolControlProps) {
  return (
    <AccordionItem value="drawing-tools">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Drawing Tools
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
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
            />
          </div>
          <p className="text-xs text-muted-foreground">Choose the color for your strokes.</p>
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
            />
          </div>
          <p className="text-xs text-muted-foreground">Set the canvas background color.</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
