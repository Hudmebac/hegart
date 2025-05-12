
"use client";

import type { AnimationSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, Maximize, RotateCw } from "lucide-react";

interface AnimationControlProps {
  animation: AnimationSettings;
  onAnimationChange: (settings: AnimationSettings) => void;
}

export function AnimationControl({ animation, onAnimationChange }: AnimationControlProps) {
  return (
    <AccordionItem value="animation">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Animation Controls
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 pt-4">
        {/* Pulsing Animation */}
        <div className="space-y-1 border-b pb-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPulsing" className="text-sm font-medium">Line Width Pulse</Label>
            <Switch
              id="isPulsing"
              checked={animation.isPulsing}
              onCheckedChange={(checked) => onAnimationChange({ ...animation, isPulsing: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Animate line width with a pulsing effect.</p>
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
                  max={20}
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
             <Label htmlFor="isScaling" className="text-sm font-medium flex items-center gap-1">
               <Maximize className="h-4 w-4"/> Scaling Pulse
             </Label>
            <Switch
              id="isScaling"
              checked={animation.isScaling}
              onCheckedChange={(checked) => onAnimationChange({ ...animation, isScaling: checked })}
            />
          </div>
           <p className="text-xs text-muted-foreground">Animate the overall scale (size) of the drawing.</p>
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
                  min={0.01} // 1% change
                  max={0.5} // 50% change
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
             <Label htmlFor="isSpinning" className="text-sm font-medium flex items-center gap-1">
               <RotateCw className="h-4 w-4"/> Spinning
             </Label>
            <Switch
              id="isSpinning"
              checked={animation.isSpinning}
              onCheckedChange={(checked) => onAnimationChange({ ...animation, isSpinning: checked })}
            />
          </div>
           <p className="text-xs text-muted-foreground">Continuously rotate the drawing.</p>
          {animation.isSpinning && (
            <div className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="spinSpeed" className="text-xs">Spin Speed ({animation.spinSpeed}°/s)</Label>
                <Slider
                  id="spinSpeed"
                  min={-180} // Counter-clockwise
                  max={180} // Clockwise
                  step={5}
                  value={[animation.spinSpeed]}
                  onValueChange={(value) => onAnimationChange({ ...animation, spinSpeed: value[0] })}
                />
                 <p className="text-xs text-muted-foreground">Positive values spin clockwise, negative values spin counter-clockwise.</p>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
