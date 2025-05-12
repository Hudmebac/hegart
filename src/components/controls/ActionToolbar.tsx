
"use client";

import { Button } from "@/components/ui/button";
import { Eraser, Save, DownloadCloud, Share2, Undo2 } from "lucide-react"; // Import Undo2 icon
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ActionToolbarProps {
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void; // Add onUndo prop
  canUndo: boolean; // Add canUndo prop
}

export function ActionToolbar({ onClear, onSave, onUndo, canUndo }: ActionToolbarProps) {
  return (
    <div className="flex flex-col space-y-2">
       <h2 className="text-lg font-semibold">Actions</h2>
      <div className="grid grid-cols-2 gap-2">
         <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Disable button if cannot undo */}
              <Button variant="outline" onClick={onUndo} disabled={!canUndo} className="w-full">
                <Undo2 className="mr-2 h-4 w-4" /> Undo
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo last action</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

         {/* Share button remains, but layout adjusted for 2 columns */}
         {/*
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
        */}
      </div>
    </div>
  );
}
