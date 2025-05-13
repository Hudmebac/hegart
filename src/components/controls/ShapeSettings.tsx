
"use client";

import type { ShapeType } from "@/types/drawing";
import type { ShapeSettings as AppShapeSettings, TextSettings as AppTextSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface ShapeControlProps {
  shapeSettings: AppShapeSettings;
  onShapeSettingsChange: (settings: AppShapeSettings) => void;
  textSettings: AppTextSettings;
  onTextSettingsChange: (settings: AppTextSettings) => void;
}

const availableFontFamilies = [
  'Montserrat', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 
  'Courier New', 'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma', 'Trebuchet MS'
];

export function ShapeControl({ 
  shapeSettings, onShapeSettingsChange, 
  textSettings, onTextSettingsChange 
}: ShapeControlProps) {
  const handleShapeChange = (value: ShapeType) => {
    onShapeSettingsChange({ ...shapeSettings, currentShape: value });
  };

  const handleIsFixedChange = (checked: boolean) => {
    onShapeSettingsChange({ ...shapeSettings, isFixedShape: checked });
  };

  const handleExcludeFromAnimationChange = (checked: boolean) => {
    onShapeSettingsChange({ ...shapeSettings, excludeFromAnimation: checked });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shape &amp; Text Controls</h2>
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Label htmlFor="shape-select" className="text-sm">Drawing Mode</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
               <p>Choose a mode. For shapes and text, click on the canvas to place/define.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={shapeSettings.currentShape}
          onValueChange={handleShapeChange}
        >
          <SelectTrigger id="shape-select" className="w-full mt-1">
            <SelectValue placeholder="Select a drawing mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="underline">Basic Drawing</SelectLabel>
              <SelectItem value="freehand">Freehand</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="text">Text</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="underline">Geometric Shapes</SelectLabel>
              <SelectItem value="circle">Circle</SelectItem>
              <SelectItem value="ellipse">Ellipse</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
              <SelectItem value="square">Square (Rectangle)</SelectItem>
              <SelectItem value="pentagon">Pentagon</SelectItem>
              <SelectItem value="hexagon">Hexagon</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel className="underline">Symbols &amp; Icons</SelectLabel>
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
      </div>

      {shapeSettings.currentShape === 'text' && (
        <>
          <Separator />
          <div className="space-y-4 p-1 border rounded-md bg-background shadow-sm">
             <h3 className="text-sm font-medium mb-1 -mt-1">Text Properties</h3>
            <div className="space-y-1.5">
              <Label htmlFor="text-content" className="text-xs">Content</Label>
              <Input
                id="text-content"
                value={textSettings.content}
                onChange={(e) => onTextSettingsChange({ ...textSettings, content: e.target.value })}
                placeholder="Enter text here"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="font-family" className="text-xs">Font Family</Label>
                <Select
                  value={textSettings.fontFamily}
                  onValueChange={(value) => onTextSettingsChange({ ...textSettings, fontFamily: value })}
                >
                  <SelectTrigger id="font-family"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableFontFamilies.map(font => (
                      <SelectItem key={font} value={font} style={{fontFamily: font}}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="font-size" className="text-xs">Font Size ({textSettings.fontSize}px)</Label>
                 <Slider
                    id="font-size"
                    min={8} max={144} step={1}
                    value={[textSettings.fontSize]}
                    onValueChange={(val) => onTextSettingsChange({...textSettings, fontSize: val[0]})}
                 />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="font-bold"
                        checked={textSettings.fontWeight === 'bold'}
                        onCheckedChange={(checked) => onTextSettingsChange({ ...textSettings, fontWeight: checked ? 'bold' : 'normal' })}
                    />
                    <Label htmlFor="font-bold" className="text-xs font-normal cursor-pointer">Bold</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="font-italic"
                        checked={textSettings.fontStyle === 'italic'}
                        onCheckedChange={(checked) => onTextSettingsChange({ ...textSettings, fontStyle: checked ? 'italic' : 'normal' })}
                    />
                    <Label htmlFor="font-italic" className="text-xs font-normal cursor-pointer">Italic</Label>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1.5">
                    <Label htmlFor="text-align" className="text-xs">Text Align</Label>
                    <Select
                        value={textSettings.textAlign}
                        onValueChange={(value: CanvasTextAlign) => onTextSettingsChange({ ...textSettings, textAlign: value})}
                    >
                        <SelectTrigger id="text-align"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="text-baseline" className="text-xs">Text Baseline</Label>
                    <Select
                        value={textSettings.textBaseline}
                        onValueChange={(value: CanvasTextBaseline) => onTextSettingsChange({ ...textSettings, textBaseline: value})}
                    >
                        <SelectTrigger id="text-baseline"><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="middle">Middle</SelectItem>
                            <SelectItem value="alphabetic">Alphabetic (Default)</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="hanging">Hanging</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFixedShape"
            checked={shapeSettings.isFixedShape}
            onCheckedChange={handleIsFixedChange}
            disabled={shapeSettings.currentShape === 'freehand'}
          />
          <Label htmlFor="isFixedShape" className="text-sm font-normal cursor-pointer">
            Fixed Element (No Symmetry)
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-xs">
              <p>If checked, this element will not be affected by mirror or rotational symmetry settings. (Not applicable to freehand drawing).</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="excludeFromAnimation"
            checked={shapeSettings.excludeFromAnimation}
            onCheckedChange={handleExcludeFromAnimationChange}
            disabled={shapeSettings.currentShape === 'freehand'}
          />
          <Label htmlFor="excludeFromAnimation" className="text-sm font-normal cursor-pointer">
            Exclude from Animation
          </Label>
           <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-xs">
              <p>If checked, this element will not be affected by any animation settings (pulse, scale, spin). (Not applicable to freehand drawing).</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
