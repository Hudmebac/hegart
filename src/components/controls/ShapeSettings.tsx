
"use client";

import type { ShapeType } from "@/types/drawing";
import type { ShapeSettings as AppShapeSettings } from "@/components/AppClient"; // Use AppShapeSettings to avoid conflict
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shapes } from "lucide-react"; 

interface ShapeControlProps {
  shapes: AppShapeSettings; // Use aliased ShapeSettings
  onShapesChange: (settings: AppShapeSettings) => void;
}

export function ShapeControl({ shapes, onShapesChange }: ShapeControlProps) {
  const handleShapeChange = (value: ShapeType) => {
    onShapesChange({ ...shapes, currentShape: value });
  };

  return (
    <AccordionItem value="shapes">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Shapes className="h-5 w-5" />
          Shape Controls
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
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
                <SelectLabel>Basic</SelectLabel>
                <SelectItem value="freehand">Freehand</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="ellipse">Ellipse</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Polygons</SelectLabel>
                <SelectItem value="triangle">Triangle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="pentagon">Pentagon</SelectItem>
                <SelectItem value="hexagon">Hexagon</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Other</SelectLabel>
                <SelectItem value="star">Star (5-point)</SelectItem>
                <SelectItem value="arrow">Arrow</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose 'Freehand' to draw normally, or select a shape to draw it by defining its start and end points.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
