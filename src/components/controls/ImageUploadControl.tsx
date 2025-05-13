
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageUploadControlProps {
  onImageUpload: (file: File) => void;
  mainCanvasDimensions: { width: number, height: number }; 
}

export function ImageUploadControl({ onImageUpload }: ImageUploadControlProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <h2 className="text-lg font-semibold">Image Controls</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <p>Upload an image to add it to the canvas. Click and drag the image to position it.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div>
        <Input
          id="imageUploadControl"
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onImageUpload(e.target.files[0]);
              e.target.value = ''; 
            }
          }}
        />
        <Button asChild variant="outline" className="w-full">
          <Label htmlFor="imageUploadControl" className="cursor-pointer flex items-center justify-center">
            <Upload className="mr-2 h-4 w-4" /> Select Image File
          </Label>
        </Button>
      </div>
      {/* Future image manipulation controls could go here, e.g., delete selected image, layer controls */}
    </div>
  );
}
