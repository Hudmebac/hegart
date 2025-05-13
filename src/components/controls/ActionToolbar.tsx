
"use client";

import { Button } from "@/components/ui/button";
import { Eraser, Save, Undo2, RotateCcw, CircleDot, Square as StopIcon } from "lucide-react"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActionToolbarProps {
  onClear: () => void;
  onSave: () => void;
  onUndo: () => void; 
  canUndo: boolean; 
  onResetSettings: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function ActionToolbar({ 
  onClear, 
  onSave, 
  onUndo, 
  canUndo, 
  onResetSettings,
  isRecording,
  onStartRecording,
  onStopRecording 
}: ActionToolbarProps) {
  return (
    <div className="flex flex-col space-y-2">
       <h2 className="text-lg font-semibold">Actions</h2>
      <div className="grid grid-cols-2 gap-2">
         <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onUndo} disabled={!canUndo} className="w-full">
                <Undo2 className="mr-2 h-4 w-4" /> Undo
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo last drawing action</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onClear} className="w-full">
                <Eraser className="mr-2 h-4 w-4" /> Clear Canvas
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear drawing and images</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onSave} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Export PNG
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save drawing as PNG image</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isRecording ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" onClick={onStopRecording} className="w-full">
                            <StopIcon className="mr-2 h-4 w-4" /> Stop Rec.
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Stop recording canvas</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : (
            <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" onClick={onStartRecording} className="w-full">
                            <CircleDot className="mr-2 h-4 w-4" /> Record Video
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Record canvas as WebM video</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )}
        
        <AlertDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full col-span-2"> {/* Make it span 2 columns or adjust layout */}
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset All
                    </Button>
                  </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset all settings and clear canvas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will reset all drawing settings (symmetry, animation, colors, shapes, etc.) 
                to their default values and clear the entire canvas (drawings and images). 
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onResetSettings} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Confirm Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
