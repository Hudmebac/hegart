
import type { Point, ShapeType } from '@/types/drawing';

/**
 * Generates points for a regular polygon centered between start and end points.
 * @param sides Number of sides for the polygon.
 * @param start Starting point of the defining line.
 * @param end Ending point of the defining line.
 * @returns Array of points representing the polygon vertices.
 */
function generateRegularPolygon(sides: number, start: Point, end: Point): Point[] {
    const points: Point[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const radius = Math.sqrt(dx * dx + dy * dy) / 2;
    const centerX = start.x + dx / 2;
    const centerY = start.y + dy / 2;
    
    if (radius === 0) return [start, end]; // Avoid issues with zero radius

    let startAngle = Math.atan2(dy, dx) - Math.PI / 2; 

    if (sides === 3) { 
         startAngle = Math.atan2(dy, dx) - Math.PI / 2;
    } else if (sides === 4) { // Square (rectangle)
         // For a rectangle aligned with the drag direction:
        const angle = Math.atan2(dy, dx);
        const halfWidth = Math.abs(dx) / 2;
        const halfHeight = Math.abs(dy) / 2;
        // This creates a bounding box based on start/end, not a rotated square.
        // For a true square based on start/end as diagonal:
        if (start.x !== end.x && start.y !== end.y) {
             const sideLength = Math.min(Math.abs(dx), Math.abs(dy)); // This isn't quite right for diagonal
             // A true square from diagonal uses specific rotation logic
             // For simplicity, let's keep the behavior aligned with other polygons (outer radius)
             // The current generateRegularPolygon creates a square rotated to align one side with drag vector.
             startAngle = Math.atan2(dy, dx) - Math.PI / 4; 
        } else if (start.x === end.x) { // Vertical line
            startAngle = -Math.PI / 4;
        } else { // Horizontal line
            startAngle = Math.PI / 4;
        }
    } else if (sides === 5 || sides === 6) { 
         startAngle = Math.atan2(dy, dx) - Math.PI / 2;
    }


    for (let i = 0; i < sides; i++) {
        const angle = startAngle + (i * 2 * Math.PI) / sides;
        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }
    if (sides > 2 && points.length > 0) { // Close polygon shapes
        points.push({...points[0]});
    }
    return points;
}

/**
 * Generates points for a circle based on the diameter defined by start and end points.
 * Approximates the circle using line segments.
 * @param start Starting point of the diameter.
 * @param end Ending point of the diameter.
 * @param segments Number of line segments to approximate the circle.
 * @returns Array of points representing the circle approximation.
 */
function generateCircle(start: Point, end: Point, segments: number = 36): Point[] {
    const points: Point[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const radius = Math.sqrt(dx * dx + dy * dy) / 2;
    const centerX = start.x + dx / 2;
    const centerY = start.y + dy / 2;

    if (radius === 0) return [start, end];

    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }
    points.push({...points[0]}); // Close the circle

    return points;
}

const generateLine = (start: Point, end: Point): Point[] => [start, end];

const generateEllipse = (start: Point, end: Point, segments: number = 36): Point[] => {
    const points: Point[] = [];
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    const radiusX = (maxX - minX) / 2;
    const radiusY = (maxY - minY) / 2;
    const centerX = minX + radiusX;
    const centerY = minY + radiusY;

    if (radiusX <= 0 || radiusY <= 0) return [start, end]; 

    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: centerX + radiusX * Math.cos(angle),
            y: centerY + radiusY * Math.sin(angle),
        });
    }
    points.push({...points[0]}); 
    return points;
};

const generateStar = (start: Point, end: Point, numPoints: number = 5, innerRatio: number = 0.5): Point[] => {
    const path: Point[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const outerRadius = Math.sqrt(dx * dx + dy * dy) / 2;
    const innerRadius = outerRadius * innerRatio;
    const centerX = start.x + dx / 2;
    const centerY = start.y + dy / 2;
    
    if (outerRadius === 0) return [start, end];

    let rotation = Math.atan2(dy, dx) - Math.PI / 2; 

    for (let i = 0; i < numPoints * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = rotation + (i * Math.PI) / numPoints;
        path.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }
    path.push({...path[0]}); 
    return path;
};

const generateArrow = (start: Point, end: Point, headSizeFactor: number = 0.1): Point[] => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const headSize = Math.max(10, length * headSizeFactor); 

    const angle = Math.atan2(dy, dx);

    return [
        start, 
        end,   
        { x: end.x - headSize * Math.cos(angle - Math.PI / 6), y: end.y - headSize * Math.sin(angle - Math.PI / 6) }, 
        end,   
        { x: end.x - headSize * Math.cos(angle + Math.PI / 6), y: end.y - headSize * Math.sin(angle + Math.PI / 6) }, 
    ];
};

const generateHeart = (start: Point, end: Point): Point[] => {
    // Uses bounding box defined by start and end
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const width = maxX - minX;
    const height = maxY - minY;

    if (width === 0 || height === 0) return [start, end];

    const points: Point[] = [];
    // Simplified heart shape using line segments (approximating Bezier curves)
    // Top-left lobe
    points.push({ x: minX + width * 0.5, y: minY + height * 0.3 });
    points.push({ x: minX + width * 0.15, y: minY });
    points.push({ x: minX, y: minY + height * 0.4 });
    // Bottom point
    points.push({ x: minX + width * 0.5, y: maxY });
    // Top-right lobe
    points.push({ x: maxX, y: minY + height * 0.4 });
    points.push({ x: minX + width * 0.85, y: minY });
    points.push({ x: minX + width * 0.5, y: minY + height * 0.3 }); // Close the shape

    return points;
};

const generateCloud = (start: Point, end: Point): Point[] => {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 10 || height < 10) return [start, end]; // Min size for a cloud

    const points: Point[] = [];
    const segments = 12; // Per "bubble"

    // Bottom flat-ish part
    points.push({ x: minX + width * 0.2, y: maxY });
    points.push({ x: minX + width * 0.8, y: maxY });

    // Right bubble
    let cx = minX + width * 0.75;
    let cy = minY + height * 0.7;
    let rx = width * 0.25;
    let ry = height * 0.3;
    for (let i = 0; i <= segments / 2; i++) {
        const angle = Math.PI + (i * Math.PI) / segments; // Half circle
        points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }

    // Top-middle bubble
    cx = minX + width * 0.5;
    cy = minY + height * 0.35;
    rx = width * 0.3;
    ry = height * 0.35;
     for (let i = 0; i <= segments; i++) {
        const angle = Math.PI + (i * Math.PI*2) / segments; 
        if(angle > Math.PI * 1.2 && angle < Math.PI * 2.8) { // Partial arc
             points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
        }
    }
    
    // Left bubble
    cx = minX + width * 0.25;
    cy = minY + height * 0.7;
    rx = width * 0.25;
    ry = height * 0.3;
    for (let i = segments / 2; i <= segments; i++) {
        const angle = Math.PI + (i * Math.PI) / segments; // Half circle
        points.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
    }
    
    points.push({ x: minX + width * 0.2, y: maxY }); // Close shape

    return points;
};

const generateSpeechBubble = (start: Point, end: Point): Point[] => {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 10 || height < 10) return [start, end];

    const bubbleHeight = height * 0.8; // Main bubble part
    const tailHeight = height * 0.2;

    return [
        { x: minX, y: minY }, // Top-left
        { x: maxX, y: minY }, // Top-right
        { x: maxX, y: minY + bubbleHeight }, // Bottom-right of bubble
        // Tail (pointing downwards, slightly to the left)
        { x: minX + width * 0.7, y: minY + bubbleHeight },
        { x: minX + width * 0.5, y: maxY }, // Tip of tail
        { x: minX + width * 0.4, y: minY + bubbleHeight },
        { x: minX, y: minY + bubbleHeight }, // Bottom-left of bubble
        { x: minX, y: minY }, // Close
    ];
};

const generateGear = (start: Point, end: Point, numTeeth: number = 8): Point[] => {
    const points: Point[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const outerRadius = Math.sqrt(dx * dx + dy * dy) / 2;
    const innerRadius = outerRadius * 0.7; // Radius for the valleys between teeth
    const toothDepthRadius = outerRadius * 0.85; // Where the flat top of tooth starts

    const centerX = start.x + dx / 2;
    const centerY = start.y + dy / 2;

    if (outerRadius < 5) return [start, end];

    const angleStep = (2 * Math.PI) / numTeeth;

    for (let i = 0; i < numTeeth; i++) {
        const angle = i * angleStep;
        // Valley point (inner)
        points.push({
            x: centerX + innerRadius * Math.cos(angle - angleStep / 4),
            y: centerY + innerRadius * Math.sin(angle - angleStep / 4)
        });
        // Side of tooth (rising)
        points.push({
            x: centerX + toothDepthRadius * Math.cos(angle + angleStep / 8),
            y: centerY + toothDepthRadius * Math.sin(angle + angleStep / 8)
        });
        // Outer point 1 of tooth
        points.push({
            x: centerX + outerRadius * Math.cos(angle + angleStep / 4),
            y: centerY + outerRadius * Math.sin(angle + angleStep / 4)
        });
        // Outer point 2 of tooth
        points.push({
            x: centerX + outerRadius * Math.cos(angle + angleStep * 3/8),
            y: centerY + outerRadius * Math.sin(angle + angleStep * 3/8)
        });
         // Side of tooth (falling)
        points.push({
            x: centerX + toothDepthRadius * Math.cos(angle + angleStep * 5/8),
            y: centerY + toothDepthRadius * Math.sin(angle + angleStep * 5/8)
        });
    }
    points.push({...points[0]});
    return points;
};

const generateCheckMark = (start: Point, end: Point): Point[] => {
    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);
    const width = maxX - minX;
    const height = maxY - minY;

    if (width < 5 || height < 5) return [start, end];

    return [
        { x: minX, y: minY + height * 0.5 }, // Left start
        { x: minX + width * 0.4, y: maxY }, // Bottom V point
        { x: maxX, y: minY },                // Right top end
    ];
};


/**
 * Dispatches to the correct shape generation function based on the shape type.
 * @param shape The type of shape to draw.
 * @param start The starting point defined by the user.
 * @param end The ending point defined by the user.
 * @param canvasWidth Width of the canvas (optional, for constraints).
 * @param canvasHeight Height of the canvas (optional, for constraints).
 * @returns An array of points representing the vertices of the shape.
 */
export function drawShape(
    shape: ShapeType,
    start: Point,
    end: Point,
    canvasWidth?: number,
    canvasHeight?: number
): Point[] {
    let points: Point[] = [];

    if (start.x === end.x && start.y === end.y && shape !== 'freehand' && shape !== 'line' && shape !== 'text') {
        const tinyOffset = 1;
        end = { x: start.x + tinyOffset, y: start.y + tinyOffset };
    }


    switch (shape) {
        case 'line':
            points = generateLine(start, end);
            break;
        case 'triangle':
            points = generateRegularPolygon(3, start, end);
            break;
        case 'square': // rectangle based on start/end as diagonal corners
            points = [
                { x: start.x, y: start.y },
                { x: end.x, y: start.y },
                { x: end.x, y: end.y },
                { x: start.x, y: end.y },
                { x: start.x, y: start.y }, // Close the shape
            ];
            break;
        case 'circle':
            points = generateCircle(start, end);
            break;
        case 'ellipse':
            points = generateEllipse(start, end);
            break;
        case 'pentagon':
            points = generateRegularPolygon(5, start, end);
            break;
        case 'hexagon':
            points = generateRegularPolygon(6, start, end);
            break;
        case 'star':
            points = generateStar(start, end);
            break;
        case 'arrow':
            points = generateArrow(start, end);
            break;
        case 'heart':
            points = generateHeart(start, end);
            break;
        case 'cloud':
            points = generateCloud(start, end);
            break;
        case 'speechBubble':
            points = generateSpeechBubble(start, end);
            break;
        case 'gear':
            points = generateGear(start, end);
            break;
        case 'checkMark':
            points = generateCheckMark(start, end);
            break;
        case 'text': // Text is handled differently, no points generated here
             return []; 
        case 'freehand': 
             return [start, end]; 
        default:
            console.warn(`Unsupported shape type: ${shape}`);
            return [];
    }

    if (canvasWidth !== undefined && canvasHeight !== undefined) {
        points = points.map(p => ({
            x: Math.max(0, Math.min(p.x, canvasWidth)),
            y: Math.max(0, Math.min(p.y, canvasHeight)),
        }));
    }

    return points;
}

