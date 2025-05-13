
"use client";

import type { SymmetrySettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SymmetryControlProps {
  symmetry: SymmetrySettings;
  onSymmetryChange: (settings: SymmetrySettings) => void;
}

export function SymmetryControl({ symmetry, onSymmetryChange }: SymmetryControlProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Symmetry Controls</h2>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="mirrorX" className="text-sm">Mirror X-Axis</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <p>Mirror drawing across the vertical center.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="mirrorX"
            checked={symmetry.mirrorX}
            onCheckedChange={(checked) => onSymmetryChange({ ...symmetry, mirrorX: checked })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="mirrorY" className="text-sm">Mirror Y-Axis</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <p>Mirror drawing across the horizontal center.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="mirrorY"
            checked={symmetry.mirrorY}
            onCheckedChange={(checked) => onSymmetryChange({ ...symmetry, mirrorY: checked })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Label htmlFor="rotationalAxes" className="text-sm">Rotational Axes ({symmetry.rotationalAxes})</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <p>Number of rotational symmetry lines (1 means no rotation).</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 mt-2">
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
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <=24) {
                 onSymmetryChange({ ...symmetry, rotationalAxes: val });
              } else if (e.target.value === "") {
                 onSymmetryChange({ ...symmetry, rotationalAxes: 1 }); 
              }
            }}
            className="w-16 h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

