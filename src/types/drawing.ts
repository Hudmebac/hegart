
export interface Point {
  x: number;
  y: number;
}

export interface Path {
  points: Point[];
  color: string;
  lineWidth: number;
  fillColor?: string; // Added for fill functionality
  isFixedShape?: boolean; // New: If true, bypasses symmetry
  excludeFromAnimation?: boolean; // New: If true, bypasses animation effects
}

export interface CanvasImage {
  id: string;
  src: string; // data URI
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  rotation?: number; // Optional: in radians
  scale?: number;    // Optional: uniform scale factor
}

export type ShapeType = 
  | 'freehand' 
  | 'line' 
  | 'triangle' 
  | 'square' 
  | 'circle' 
  | 'ellipse' 
  | 'pentagon' 
  | 'hexagon' 
  | 'star' 
  | 'arrow'
  | 'heart'
  | 'cloud'
  | 'speechBubble'
  | 'gear'
  | 'checkMark';

