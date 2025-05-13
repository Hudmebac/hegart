# #HegArt - Symmetric Art Generator

Welcome to #HegArt, a web application designed for creating beautiful and intricate symmetric and animated art. Whether you're a seasoned artist or just looking to explore your creative side, #HegArt provides a user-friendly platform to bring your visions to life.

## Core Features

-   **Canvas Drawing**: A responsive digital canvas serves as your playground. Draw freeform strokes, create predefined shapes, add text, and incorporate images into your artwork.
-   **Symmetry Controls**:
    -   **Mirror Symmetry**: Enable real-time mirroring of your strokes across the X (vertical) and/or Y (horizontal) axes.
    -   **Rotational Symmetry**: Define multiple rotational axes to create complex mandala-like patterns effortlessly.
-   **Animation Controls**:
    -   **Pulsing Effects**: Animate your designs with a dynamic pulsing effect that rhythmically adjusts line widths.
    -   **Scaling Animation**: Make your artwork grow and shrink with a smooth scaling animation.
    -   **Spinning Animation**: Add a rotational spin to your entire creation, with options to control speed and direction.
    -   Animations can be started, stopped, and customized with parameters like speed and intensity.
-   **Shape & Text Tools**:
    -   Choose from a variety of predefined shapes (lines, circles, squares, triangles, stars, hearts, etc.) to add to your canvas.
    -   Add customizable text elements with various fonts, sizes, and styles.
    -   Control whether individual shapes or text elements are affected by symmetry and animation settings.
-   **Image Integration**:
    -   Upload your own images to incorporate into your drawings.
    -   Position and move uploaded images on the canvas.
-   **Drawing Tools**:
    -   Select stroke and fill colors using an intuitive color picker.
    -   Adjust line width for varying stroke thickness.
    -   Change the canvas background color.
    -   Activate a "Fill Mode" to easily color enclosed areas of your drawing.
-   **Actions & Utilities**:
    -   **Undo**: Revert your last action.
    -   **Clear Canvas**: Start fresh by clearing all elements.
    -   **Save Drawing**: Export your static artwork as a PNG image.
    -   **Record Animation**: Capture your animated creations as a WebM video file, saved locally.
    -   **Reset Settings**: Restore all controls and the canvas to their initial default states with a confirmation prompt.
-   **Interactive Preview**:
    -   A resizable and pannable preview window shows your static drawing, allowing you to zoom and inspect details without animation or symmetry effects applied.
-   **Responsive UI & Theming**:
    -   A modern, intuitive interface built with Next.js, React, Tailwind CSS, and ShadCN UI components.
    -   Supports light and dark themes, adapting to your system preference or manual selection.
    -   Responsive design for usability across various screen sizes, with a collapsible/pinnable sidebar for controls.

## Technology Stack

-   **Frontend**: Next.js (App Router), React, TypeScript
-   **Styling**: Tailwind CSS, ShadCN UI (for components)
-   **Icons**: Lucide React
-   **State Management**: React Hooks (useState, useCallback, useEffect, etc.)
-   **Graphics**: HTML5 Canvas API

## Getting Started

To run #HegArt locally (assuming you have Node.js and npm/yarn installed):

1.  **Clone the repository** (if applicable, or start from your project setup).
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
4.  Open [http://localhost:9002](http://localhost:9002) (or the port specified in your setup) in your browser to view the application.

## How to Use

1.  **Explore Controls**: The sidebar (pinnable and collapsible) and header icons provide access to all drawing, symmetry, animation, and action controls.
2.  **Draw**: Select "Freehand" or a shape from the "Shapes & Text" section. Click and drag on the canvas.
3.  **Symmetry**: Adjust X/Y mirroring and rotational axes in the "Symmetry" section. Your drawing will update in real-time.
4.  **Animate**: Toggle pulsing, scaling, or spinning effects in the "Animation" section and fine-tune their parameters.
5.  **Add Images/Text**: Use the "Image Controls" or "Shapes & Text" (for text mode) to add more elements.
6.  **Preview**: Toggle the preview window from the header to see a static, un-animated version of your work.
7.  **Save/Record**: Use the "Actions" section to save your art as an image or record an animation.

Enjoy creating with #HegArt!
