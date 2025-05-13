
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap, Maximize, RotateCw, Contrast, Settings, Palette, Shapes, Image as ImageIcon, Type, SlidersHorizontal, MousePointer2, Pin, ListCollapse, HelpCircle, PaletteIcon, ShapesIcon, ImageIcon as ImageIconLucide, SymmetryIcon, AnimationIcon, SlidersHorizontal as ActionsIcon, Presentation as PreviewIconLucide } from "lucide-react";

export function HowToGuide() {
  return (
    <div className="space-y-6">
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertTitle>Welcome to #HegArt!</AlertTitle>
        <AlertDescription>
          This guide will walk you through all the features of #HegArt, helping you create beautiful symmetric and animated art. Explore the sections below to learn more.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Interface Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>#HegArt's interface is designed for ease of use and creative flow. It consists of three main areas:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li><strong>Header:</strong> Contains global controls like theme toggle, sidebar pinning, quick access to control sections, preview toggle, and this How-To guide.</li>
            <li><strong>Sidebar:</strong> Houses all the detailed controls for drawing, symmetry, animation, images, and actions. It can be pinned, unpinned, or collapsed. Content displayed here is managed via header icons.</li>
            <li><strong>Canvas:</strong> The large central area where you create your artwork.</li>
          </ul>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full space-y-4">
        <AccordionItem value="drawing-basics">
          <AccordionTrigger className="text-xl font-semibold"><MousePointer2 className="mr-2 h-5 w-5" />Drawing Basics</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ShapesIcon className="h-5 w-5"/>Drawing Modes (Shapes & Text Section)</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-2">Access drawing modes from the "Shapes & Text" section in the sidebar (or via header icon <ShapesIcon className="inline h-4 w-4"/>).</p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="freehand">
                    <AccordionTrigger>Freehand Drawing</AccordionTrigger>
                    <AccordionContent>
                      Select "Freehand" from the "Drawing Mode" dropdown. Click and drag on the canvas to draw freeform lines.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shapes">
                    <AccordionTrigger>Using Shape Tools</AccordionTrigger>
                    <AccordionContent>
                      <p>Choose a shape (e.g., Line, Circle, Square, Triangle, Pentagon, Hexagon, Star, Arrow, Heart, Cloud, Speech Bubble, Gear, Check Mark) from the "Drawing Mode" dropdown.</p>
                      <p className="mt-1">For most shapes, click once on the canvas to set the starting point, then drag and release to define the shape's size and orientation. Shapes like circles or squares are typically drawn based on the diagonal of the rectangle you define by dragging.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="text">
                    <AccordionTrigger className="flex items-center gap-1"><Type className="h-4 w-4" />Adding Text</AccordionTrigger>
                    <AccordionContent>
                      <p>Select "Text" from the "Drawing Mode" dropdown. Configure text properties like content, font, size, style, alignment in the "Text Properties" area that appears.</p>
                      <p className="mt-1">Click on the canvas where you want to place the text. The text will appear with the current settings.</p>
                      <p className="mt-1 text-sm text-muted-foreground">Note: Text color is determined by the "Stroke Color" in the Drawing Tools section.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PaletteIcon className="h-5 w-5"/>Drawing Tools</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-2">Find these in the "Drawing Tools" section (header icon <PaletteIcon className="inline h-4 w-4"/>).</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                  <li><strong>Stroke Color:</strong> Sets the color for lines and text. Use the color picker or type a hex code.</li>
                  <li><strong>Fill Color:</strong> Sets the color used for filling shapes.
                    <ul className="list-circle list-inside pl-4 mt-1">
                      <li>Shapes drawn (except lines/freehand) will use this as their initial fill color if applicable.</li>
                      <li><strong>Fill Mode:</strong> Click the "Activate Fill" button (with <Palette className="inline h-4 w-4"/> icon). The button will change to "Fill Active". Then, click on existing closed shapes on the canvas to fill them with the selected Fill Color. The mouse cursor will change to a paint bucket. Click the button again to deactivate fill mode.</li>
                    </ul>
                  </li>
                  <li><strong>Line Width:</strong> Adjusts the thickness of strokes using a slider (1px to 50px).</li>
                  <li><strong>Background Color:</strong> Changes the background color of the main canvas.</li>
                </ul>
              </CardContent>
            </Card>
             <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ImageIconLucide className="h-5 w-5"/>Image Integration</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-2">Access via the "Image Controls" section (header icon <ImageIconLucide className="inline h-4 w-4"/>).</p>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Upload Image:</strong> Click "Select Image File" to choose an image from your device. It will be added to the center of the canvas.</li>
                    <li><strong>Moving Images:</strong> Once an image is added, it's automatically selected. Click and drag it to reposition. Clicking on an unselected image will select it.</li>
                    <li><strong>Deselecting Images:</strong> Drawing a new path, adding text, or clicking on the canvas background will deselect the image.</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="symmetry-controls">
          <AccordionTrigger className="text-xl font-semibold"><SymmetryIcon className="mr-2 h-5 w-5" />Symmetry Controls</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <p className="mb-2">Found in the "Symmetry" section (header icon <SymmetryIcon className="inline h-4 w-4"/>). These controls affect your drawing in real-time.</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Mirror X-Axis:</strong> Toggles mirroring across a vertical line in the center of the canvas.</li>
              <li><strong>Mirror Y-Axis:</strong> Toggles mirroring across a horizontal line in the center of the canvas.</li>
              <li><strong>Rotational Axes:</strong> Use the slider or input field to set the number of rotational symmetry axes (1 to 24). '1' means no rotational symmetry. Higher numbers create more intricate, mandala-like patterns.</li>
            </ul>
            <Alert variant="default" className="mt-3">
              <Info className="h-4 w-4"/>
              <AlertDescription>
                <strong>Fixed Elements:</strong> In the "Shapes & Text" section, when drawing shapes or text (not freehand), you can check "Fixed Element (No Symmetry)". Such elements will ignore all symmetry settings and be placed as a single instance.
              </AlertDescription>
            </Alert>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="animation-controls">
          <AccordionTrigger className="text-xl font-semibold"><AnimationIcon className="mr-2 h-5 w-5" />Animation Controls</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
             <p className="mb-2">Located in the "Animation" section (header icon <AnimationIcon className="inline h-4 w-4"/>). These add dynamic effects to your artwork.</p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>
                <strong>Line Width Pulse (<Zap className="inline h-4 w-4"/>):</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                  <li>Makes lines rhythmically grow thicker and thinner, potentially appearing and disappearing at intensity extremes.</li>
                  <li><strong>Pulse Speed:</strong> Controls how fast the pulsing effect occurs.</li>
                  <li><strong>Pulse Intensity:</strong> Determines the maximum change in line width.</li>
                </ul>
              </li>
              <li>
                <strong>Scaling Pulse (<Maximize className="inline h-4 w-4"/>):</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                  <li>Makes the entire drawing rhythmically grow larger and smaller from the center.</li>
                  <li><strong>Scale Speed:</strong> Controls the speed of the scaling animation.</li>
                  <li><strong>Scale Intensity:</strong> Adjusts how much the drawing scales (e.g., 0.1 means +/- 10% of original size).</li>
                </ul>
              </li>
              <li>
                <strong>Spinning (<RotateCw className="inline h-4 w-4"/>):</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                  <li>Rotates the entire drawing around the canvas center.</li>
                  <li><strong>Spin Speed:</strong> Sets the rotation speed in degrees per second. Positive values spin clockwise, negative values counter-clockwise.</li>
                  <li><strong>Direction Change Freq.:</strong> Average time in seconds between random direction flips. Set to 0 for continuous rotation in one direction.</li>
                </ul>
              </li>
            </ul>
             <Alert variant="default" className="mt-3">
                <Info className="h-4 w-4"/>
               <AlertDescription>
                 <strong>Exclude from Animation:</strong> In the "Shapes & Text" section, for shapes or text (not freehand), you can check "Exclude from Animation". These elements will remain static and ignore all animation settings.
               </AlertDescription>
             </Alert>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="actions-utilities">
          <AccordionTrigger className="text-xl font-semibold"><ActionsIcon className="mr-2 h-5 w-5" />Actions & Utilities</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
             <p className="mb-2">Access these essential tools from the "Actions" section in the sidebar (header icon <ActionsIcon className="inline h-4 w-4"/>).</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Undo:</strong> Reverts the last drawing, fill, image addition, or text addition. Limited by history.</li>
              <li><strong>Clear Canvas:</strong> Removes all paths, images, and text from the canvas. This action also clears the undo history.</li>
              <li><strong>Save Drawing:</strong> Exports the current static state of your drawing (including symmetry but not animation) as a PNG image file to your computer.</li>
              <li><strong>Record Animation:</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                    <li>Click the record button (<Contrast className="inline h-4 w-4" /> icon) to start recording the canvas.</li>
                    <li>While recording, any animations and drawing actions will be captured.</li>
                    <li>Click the stop button (Square icon) to finish recording. A WebM video file will be generated and downloaded.</li>
                </ul>
              </li>
              <li><strong>Reset Settings:</strong> A confirmation dialog will appear. If confirmed, this action will:
                <ul className="list-square list-inside pl-4 mt-1">
                    <li>Reset all symmetry, animation, drawing tools, and shape/text settings to their defaults.</li>
                    <li>Clear the entire canvas (paths, images, text).</li>
                    <li>Clear the undo history.</li>
                </ul>
              This is useful for starting completely fresh.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preview-window">
          <AccordionTrigger className="text-xl font-semibold"><PreviewIconLucide className="mr-2 h-5 w-5" />Preview Window</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <p>Toggle the Preview Window using its icon (<PreviewIconLucide className="inline h-4 w-4"/>) in the header.</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Purpose:</strong> Shows a static, un-animated, and non-symmetrically-rendered version of your completed drawing elements (paths, images, text). This is helpful for inspecting details without dynamic effects.</li>
              <li><strong>Location:</strong> Appears as a draggable and resizable box in the top-right corner of the application.</li>
              <li><strong>Interactivity:</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-1">
                  <li><strong>Pan:</strong> Click and drag inside the preview window to move the view.</li>
                  <li><strong>Zoom:</strong> Use your mouse scroll wheel while hovering over the preview to zoom in and out. Alternatively, use the zoom buttons within the preview.</li>
                  <li><strong>Reset View:</strong> Click the reset icon in the preview controls to return to the default pan and zoom.</li>
                </ul>
              </li>
              <li>The preview reflects the raw paths, images, and text as they were added, not their symmetrically rendered or animated counterparts.</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sidebar-header-management">
          <AccordionTrigger className="text-xl font-semibold"><Pin className="mr-2 h-5 w-5" />Sidebar & Header Controls</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <Card>
                <CardHeader><CardTitle className="text-lg">Sidebar Management</CardTitle></CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>Pin/Unpin:</strong> Use the Pin (<Pin className="inline h-4 w-4"/>) / Unpin (<PinOff className="inline h-4 w-4"/>) icon in the main header to control sidebar behavior.
                            <ul className="list-circle list-inside pl-4 mt-1">
                                <li><strong>Pinned:</strong> The sidebar remains visible.</li>
                                <li><strong>Unpinned:</strong> The sidebar collapses to icons. Hover over it to temporarily expand. Click the Pin icon again to re-pin.</li>
                            </ul>
                        </li>
                        <li><strong>Mobile:</strong> On smaller screens, the sidebar is an off-canvas menu, toggled by the Menu icon in the header.</li>
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">Header Control Icons</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-2">The icons in the header provide quick access to different control sections in the sidebar:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li><PreviewIconLucide className="inline h-4 w-4 mr-1"/> Toggles the Preview Window.</li>
                        <li><ListCollapse className="inline h-4 w-4 mr-1"/> Toggles "All Sections" view in the sidebar. When active, all control sections are shown as collapsible accordions.</li>
                        <li><ActionsIcon className="inline h-4 w-4 mr-1"/> Shows/Hides the "Actions" section.</li>
                        <li><ShapesIcon className="inline h-4 w-4 mr-1"/> Shows/Hides the "Shapes & Text" section.</li>
                        <li><PaletteIcon className="inline h-4 w-4 mr-1"/> Shows/Hides the "Drawing Tools" section.</li>
                        <li><ImageIconLucide className="inline h-4 w-4 mr-1"/> Shows/Hides the "Image Controls" section.</li>
                        <li><SymmetryIcon className="inline h-4 w-4 mr-1"/> Shows/Hides the "Symmetry" section.</li>
                        <li><AnimationIcon className="inline h-4 w-4 mr-1"/> Shows/Hides the "Animation" section.</li>
                    </ul>
                    <p className="mt-2">You can select multiple icons to show those specific sections, or select the "All Sections" icon. If no specific section is selected, a default (usually "Shapes & Text") might be shown or a prompt to select one.</p>
                </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Happy Creating!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Experiment with different settings and combinations to discover unique artistic styles. #HegArt is all about exploration and fun!</p>
        </CardContent>
      </Card>
    </div>
  );
}
