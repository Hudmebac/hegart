
"use client";

import type { ShapeType } from "@/types/drawing";
import type { ShapeSettings as AppShapeSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ShapeControlProps {
  shapes: AppShapeSettings;
  onShapesChange: (settings: AppShapeSettings) => void;
}

export function ShapeControl({ shapes, onShapesChange }: ShapeControlProps) {
  const handleShapeChange = (value: ShapeType) => {
    onShapesChange({ ...shapes, currentShape: value });
  };

  const handleIsFixedChange = (checked: boolean) => {
    onShapesChange({ ...shapes, isFixedShape: checked });
  };

  const handleExcludeFromAnimationChange = (checked: boolean) => {
    onShapesChange({ ...shapes, excludeFromAnimation: checked });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shape Controls</h2>
      <div className="space-y-2">
        <Label htmlFor="shape-select" className="text-sm">Drawing Mode</Label>
        <Select
          value={shapes.currentShape}
          onValueChange={handleShapeChange}
        >
          <SelectTrigger id="shape-select" className="w-full">
            <SelectValue placeholder="Select a shape" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="underline">Basic</SelectLabel>
              <SelectItem value="freehand">Freehand</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="ellipse">Ellipse</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="underline">Polygons</SelectLabel>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="pentagon">Pentagon</SelectItem>
              <SelectItem value="hexagon">Hexagon</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="underline">Other Symbols &amp; Icons</SelectLabel>
              <SelectItem value="star">Star (5-point)</SelectItem>
              <SelectItem value="arrow">Arrow</SelectItem>
              <SelectItem value="heart">Heart</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="speechBubble">Speech Bubble</SelectItem>
              <SelectItem value="gear">Gear</SelectItem>
              <SelectItem value="checkMark">Check Mark</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose 'Freehand' to draw normally, or select a shape to draw it by defining its start and end points.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFixedShape"
            checked={shapes.isFixedShape}
            onCheckedChange={handleIsFixedChange}
          />
          <Label htmlFor="isFixedShape" className="text-sm font-normal cursor-pointer">
            Fixed Shape (No Symmetry)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          If checked, this shape will not be affected by mirror or rotational symmetry settings.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="excludeFromAnimation"
            checked={shapes.excludeFromAnimation}
            onCheckedChange={handleExcludeFromAnimationChange}
          />
          <Label htmlFor="excludeFromAnimation" className="text-sm font-normal cursor-pointer">
            Exclude from Animation
          </Label>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          If checked, this shape will not be affected by any animation settings (pulse, scale, spin).
        </p>
      </div>
    </div>
  );
}
