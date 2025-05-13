
"use client";

import type { AnimationSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Maximize, RotateCw, Zap, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnimationControlProps {
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
}

export function AnimationControl({ animation, onAnimationChange }: AnimationControlProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Animation Controls</h2>
      
      {/* Pulsing Animation */}
      <div className="space-y-1 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Label htmlFor="isPulsing" className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-4 w-4"/> Line Width Pulse
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <p>Animate line width. Intensity can make lines (dis)appear.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="isPulsing"
            checked={animation.isPulsing}
            onCheckedChange={(checked) => onAnimationChange({ ...animation, isPulsing: checked })}
          />
        </div>
        {animation.isPulsing && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="pulseSpeed" className="text-xs">Pulse Speed ({animation.pulseSpeed})</Label>
              <Slider
                id="pulseSpeed"
                min={1}
                max={20}
                step={1}
                value={[animation.pulseSpeed]}
                onValueChange={(value) => onAnimationChange({ ...animation, pulseSpeed: value[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pulseIntensity" className="text-xs">Pulse Intensity ({animation.pulseIntensity})</Label>
              <Slider
                id="pulseIntensity"
                min={1}
                max={50}
                step={1}
                value={[animation.pulseIntensity]}
                onValueChange={(value) => onAnimationChange({ ...animation, pulseIntensity: value[0] })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scaling Animation */}
      <div className="space-y-1 border-b pb-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1">
             <Label htmlFor="isScaling" className="text-sm font-medium flex items-center gap-1">
               <Maximize className="h-4 w-4"/> Scaling Pulse
             </Label>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
               </TooltipTrigger>
               <TooltipContent side="top" align="start">
                 <p>Animate the overall scale (size) of the drawing.</p>
               </TooltipContent>
             </Tooltip>
           </div>
          <Switch
            id="isScaling"
            checked={animation.isScaling}
            onCheckedChange={(checked) => onAnimationChange({ ...animation, isScaling: checked })}
          />
        </div>
        {animation.isScaling && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="scaleSpeed" className="text-xs">Scale Speed ({animation.scaleSpeed})</Label>
              <Slider
                id="scaleSpeed"
                min={1}
                max={10}
                step={0.5}
                value={[animation.scaleSpeed]}
                onValueChange={(value) => onAnimationChange({ ...animation, scaleSpeed: value[0] })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scaleIntensity" className="text-xs">Scale Intensity ({Math.round(animation.scaleIntensity * 100)}%)</Label>
              <Slider
                id="scaleIntensity"
                min={0.01} 
                max={0.9} 
                step={0.01}
                value={[animation.scaleIntensity]}
                onValueChange={(value) => onAnimationChange({ ...animation, scaleIntensity: value[0] })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Spinning Animation */}
       <div className="space-y-1">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-1">
             <Label htmlFor="isSpinning" className="text-sm font-medium flex items-center gap-1">
               <RotateCw className="h-4 w-4"/> Spinning
             </Label>
             <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <p>Continuously rotate the drawing.</p>
                </TooltipContent>
              </Tooltip>
           </div>
          <Switch
            id="isSpinning"
            checked={animation.isSpinning}
            onCheckedChange={(checked) => onAnimationChange({ ...animation, isSpinning: checked })}
          />
        </div>
        {animation.isSpinning && (
          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="spinSpeed" className="text-xs">Spin Speed ({animation.spinSpeed}°/s)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>Adjusts speed and direction. Positive: Clockwise, Negative: Counter-Clockwise.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="spinSpeed"
                min={-180} 
                max={180} 
                step={5}
                value={[animation.spinSpeed]}
                onValueChange={(value) => onAnimationChange({ ...animation, spinSpeed: value[0] })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="spinDirectionChangeFrequency" className="text-xs">
                  Direction Change Freq. ({animation.spinDirectionChangeFrequency}s)
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    <p>Average time in seconds between random direction flips. 0 for fixed direction.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Slider
                id="spinDirectionChangeFrequency"
                min={0}
                max={20}
                step={1}
                value={[animation.spinDirectionChangeFrequency]}
                onValueChange={(value) => onAnimationChange({ ...animation, spinDirectionChangeFrequency: value[0] })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
