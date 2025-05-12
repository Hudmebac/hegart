"use client";

import { Button } from "@/components/ui/button";
import { Eraser, Save, DownloadCloud, Share2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ActionToolbarProps {
  onClear: () => void;
  onSave: () => void;
}

export function ActionToolbar({ onClear, onSave }: ActionToolbarProps) {
  return (
    <div className="flex flex-col space-y-2">
       <h2 className="text-lg font-semibold">Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onClear} className="w-full">
                <Eraser className="mr-2 h-4 w-4" /> Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear the canvas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onSave} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save drawing as PNG</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Placeholder buttons for future features */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" disabled className="w-full">
                <DownloadCloud className="mr-2 h-4 w-4" /> Record
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Record animation (coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" disabled className="w-full">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share your art (coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
