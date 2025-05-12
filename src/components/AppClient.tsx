"use client";

import type { Point, Path } from "@/types/drawing";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DrawingCanvas } from '@/components/canvas/DrawingCanvas';
import { ControlPanel } from '@/components/controls/ControlPanel';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { HegArtLogo } from '@/components/icons/HegArtLogo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export interface SymmetrySettings {
  mirrorX: boolean;
  mirrorY: boolean;
  rotationalAxes: number;
}

export interface AnimationSettings {
  isPulsing: boolean;
  pulseSpeed: number;
  pulseIntensity: number;
}

export interface DrawingTools {
  strokeColor: string;
  lineWidth: number;
  backgroundColor: string;
}

export default function AppClient() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [symmetry, setSymmetry] = useState<SymmetrySettings>({
    mirrorX: false,
    mirrorY: false,
    rotationalAxes: 1,
  });
  const [animation, setAnimation] = useState<AnimationSettings>({
    isPulsing: false,
    pulseSpeed: 5,
    pulseIntensity: 5,
  });
  const [tools, setTools] = useState<DrawingTools>({
    strokeColor: '#000000', // Default to black for light mode
    lineWidth: 5,
    backgroundColor: '#FAFAFA', // Default light mode background
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Update strokeColor based on theme
    const isDarkMode = document.documentElement.classList.contains('dark');
    setTools(prev => ({
      ...prev,
      strokeColor: isDarkMode ? '#FFFFFF' : '#000000',
      backgroundColor: isDarkMode ? '#121212' : '#FAFAFA',
    }));
  }, []); // Runs once on mount. For dynamic theme changes, listen to theme changes.

  const handlePathAdd = useCallback((newPath: Path) => {
    setPaths((prevPaths) => [...prevPaths, newPath]);
  }, []);

  const handleClearCanvas = useCallback(() => {
    setPaths([]);
  }, []);

  const handleSaveDrawing = useCallback(() => {
    if (canvasRef.current) {
      const image = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'hegart-drawing.png';
      link.href = image;
      link.click();
    }
  }, []);

  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileSidebar}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
            <HegArtLogo className="h-8 w-auto" />
            <h1 className="font-montserrat text-xl font-bold uppercase tracking-wider hidden sm:block">#HegArt</h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            className="border-r md:w-80 lg:w-96"
            collapsible="icon"
            open={isMobileSidebarOpen}
            onOpenChange={setIsMobileSidebarOpen}
          >
            <ControlPanel
              symmetry={symmetry}
              onSymmetryChange={setSymmetry}
              animation={animation}
              onAnimationChange={setAnimation}
              tools={tools}
              onToolsChange={setTools}
              onClear={handleClearCanvas}
              onSave={handleSaveDrawing}
            />
          </Sidebar>
          <SidebarInset className="flex-1 overflow-auto p-0">
            <DrawingCanvas
              ref={canvasRef}
              paths={paths}
              onPathAdd={handlePathAdd}
              symmetrySettings={symmetry}
              animationSettings={animation}
              drawingTools={tools}
              backgroundColor={tools.backgroundColor} // Pass background color explicitly
            />
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
