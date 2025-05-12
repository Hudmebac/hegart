
"use client";

import type { ShapeSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shapes } from "lucide-react"; // Use Shapes icon

interface ShapeControlProps {
  shapes: ShapeSettings;
  onShapesChange: (settings: ShapeSettings) => void;
}

export function ShapeControl({ shapes, onShapesChange }: ShapeControlProps) {
  const handleShapeChange = (value: ShapeSettings['currentShape']) => {
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
              <SelectItem value="freehand">Freehand</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="pentagon">Pentagon</SelectItem>
              {/* Add more shapes here later if needed */}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose 'Freehand' to draw normally, or select a shape to draw it between two points.
          </p>
        </div>
        {/* Placeholder for future shape-specific settings */}
        {/*
        {shapes.currentShape !== 'freehand' && (
          <div className="border-t pt-4 mt-4 space-y-2">
            <p className="text-sm font-medium">Shape Options</p>
            <p className="text-xs text-muted-foreground">Specific options for {shapes.currentShape} will appear here.</p>
          </div>
        )}
        */}
      </AccordionContent>
    </AccordionItem>
  );
}
