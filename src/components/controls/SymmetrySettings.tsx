"use client";

import type { SymmetrySettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wand2 } from "lucide-react";

interface SymmetryControlProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
}

export function SymmetryControl({ symmetry, onSymmetryChange }: SymmetryControlProps) {
  return (
    <AccordionItem value="symmetry">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Symmetry Controls
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="mirrorX" className="text-sm">Mirror X-Axis</Label>
            <Switch
              id="mirrorX"
              checked={symmetry.mirrorX}
              onCheckedChange={(checked) => onSymmetryChange({ ...symmetry, mirrorX: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Mirror drawing across the vertical center.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="mirrorY" className="text-sm">Mirror Y-Axis</Label>
            <Switch
              id="mirrorY"
              checked={symmetry.mirrorY}
              onCheckedChange={(checked) => onSymmetryChange({ ...symmetry, mirrorY: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Mirror drawing across the horizontal center.</p>
        </div>
        <div className="space-y-3">
          <Label htmlFor="rotationalAxes" className="text-sm">Rotational Axes ({symmetry.rotationalAxes})</Label>
          <div className="flex items-center gap-2">
            <Slider
              id="rotationalAxes"
              min={1}
              max={24}
              step={1}
              value={[symmetry.rotationalAxes]}
              onValueChange={(value) => onSymmetryChange({ ...symmetry, rotationalAxes: value[0] })}
              className="flex-grow"
            />
            <Input
              type="number"
              min={1}
              max={24}
              value={symmetry.rotationalAxes}
              onChange={(e) => onSymmetryChange({ ...symmetry, rotationalAxes: parseInt(e.target.value) || 1 })}
              className="w-16 h-8 text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground">Number of rotational symmetry lines (1 means no rotation).</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
