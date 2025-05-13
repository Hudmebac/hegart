
"use client";

import { Button } from "@/components/ui/button";
import { Eraser, Save, Undo2, RotateCcw, CircleDot, Square as StopIcon, PaintBucket } from "lucide-react"; 
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
  isFillModeActive: boolean;
  onToggleFillMode: () => void;
}

export function ActionToolbar({ 
  onClear, 
  onSave, 
  onUndo, 
  canUndo, 
  onResetSettings,
  isRecording,
  onStartRecording,
  onStopRecording,
  isFillModeActive,
  onToggleFillMode,
}: ActionToolbarProps) {
  return (
    <div className="flex flex-col space-y-2">
       <h2 className="text-lg font-semibold">Actions</h2>
      <div className="grid grid-cols-2 gap-2">
         <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onUndo} disabled={!canUndo} className="w-full">
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo last drawing or fill action</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={isFillModeActive ? "secondary" : "outline"} onClick={onToggleFillMode} className="w-full">
                <PaintBucket className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFillModeActive ? "Deactivate Fill Tool. Click shapes to fill." : "Activate Fill Tool"}</p>
              <p className="text-xs text-muted-foreground">{isFillModeActive ? "Current Fill Color: Active" : "Current Fill Color: Inactive"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onClear} className="w-full">
                <Eraser className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Canvas (drawing, images, text)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onSave} className="w-full">
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export current drawing as PNG image</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>


        {isRecording ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="destructive" onClick={onStopRecording} className="w-full">
                            <StopIcon className="h-4 w-4" />
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
                            <CircleDot className="h-4 w-4" />
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
                    <Button variant="destructive" className="w-full">
                      <RotateCcw className="h-4 w-4" />
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
