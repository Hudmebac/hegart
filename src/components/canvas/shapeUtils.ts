
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
    } else if (sides === 4) { 
         startAngle = Math.atan2(dy, dx) - Math.PI / 4; 
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
    const headSize = Math.max(10, length * headSizeFactor); // Ensure minimum head size

    const angle = Math.atan2(dy, dx);

    return [
        start, 
        end,   
        { x: end.x - headSize * Math.cos(angle - Math.PI / 6), y: end.y - headSize * Math.sin(angle - Math.PI / 6) }, 
        end,   
        { x: end.x - headSize * Math.cos(angle + Math.PI / 6), y: end.y - headSize * Math.sin(angle + Math.PI / 6) }, 
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

    // Prevent issues with identical start and end points for some shapes
    if (start.x === end.x && start.y === end.y && shape !== 'freehand' && shape !== 'line') {
        // For most shapes, identical points mean no shape or a single point.
        // We can create a tiny line to make it visible or return just the start point.
        // Let's return a small representation for visual feedback if possible.
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
        case 'square':
            points = generateRegularPolygon(4, start, end);
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
            points = generateStar(start, end); // Default 5-point star
            break;
        case 'arrow':
            points = generateArrow(start, end);
            break;
        case 'freehand': // Freehand is handled by AppClient, this case is for completeness
             return [start, end]; // Or simply currentPath in AppClient
        default:
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
