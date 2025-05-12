"use client";

import type { AnimationSettings } from "@/components/AppClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap } from "lucide-react";

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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="isPulsing" className="text-sm">Enable Pulsing Animation</Label>
            <Switch
              id="isPulsing"
              checked={animation.isPulsing}
              onCheckedChange={(checked) => onAnimationChange({ ...animation, isPulsing: checked })}
            />
          </div>
           <p className="text-xs text-muted-foreground">Animate line width with a pulsing effect.</p>
        </div>
        {animation.isPulsing && (
          <>
            <div className="space-y-3">
              <Label htmlFor="pulseSpeed" className="text-sm">Pulse Speed ({animation.pulseSpeed})</Label>
              <Slider
                id="pulseSpeed"
                min={1}
                max={20}
                step={1}
                value={[animation.pulseSpeed]}
                onValueChange={(value) => onAnimationChange({ ...animation, pulseSpeed: value[0] })}
              />
              <p className="text-xs text-muted-foreground">Controls the speed of the pulsing effect.</p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="pulseIntensity" className="text-sm">Pulse Intensity ({animation.pulseIntensity})</Label>
              <Slider
                id="pulseIntensity"
                min={1}
                max={20}
                step={1}
                value={[animation.pulseIntensity]}
                onValueChange={(value) => onAnimationChange({ ...animation, pulseIntensity: value[0] })}
              />
              <p className="text-xs text-muted-foreground">Controls the strength of the pulsing effect.</p>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
