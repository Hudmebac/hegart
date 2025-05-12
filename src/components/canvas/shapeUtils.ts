
import type { Point } from '@/types/drawing';

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
    // Initial angle adjustment to align the shape nicely with the defining line if needed
    // For a triangle, maybe align one side, for square/pentagon, maybe a vertex points "up" relative to the line
    let startAngle = Math.atan2(dy, dx) - Math.PI / 2; // Default: Pointing "up" perpendicular to the line

    if (sides === 3) { // Triangle: Align base parallel to line? or vertex up? Let's try vertex up.
         startAngle = Math.atan2(dy, dx) - Math.PI / 2;
    } else if (sides === 4) { // Square: align sides with axes relative to line?
         startAngle = Math.atan2(dy, dx) - Math.PI / 4; // Align corner with line direction
    } else if (sides === 5) { // Pentagon: vertex up
         startAngle = Math.atan2(dy, dx) - Math.PI / 2;
    }


    for (let i = 0; i < sides; i++) {
        const angle = startAngle + (i * 2 * Math.PI) / sides;
        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }
    // Close the polygon by adding the starting point again if drawing lines
    // If filling, this isn't strictly necessary for canvas path drawing but good practice
    // points.push(points[0]); // Let's not close it here, the path drawing logic handles lines between points

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

    for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        points.push({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        });
    }
    // Close the circle
    points.push(points[0]);

    return points;
}


/**
 * Dispatches to the correct shape generation function based on the shape type.
 * @param shape The type of shape to draw ('triangle', 'square', 'circle', 'pentagon').
 * @param start The starting point defined by the user.
 * @param end The ending point defined by the user.
 * @param canvasWidth Width of the canvas (optional, for constraints).
 * @param canvasHeight Height of the canvas (optional, for constraints).
 * @returns An array of points representing the vertices of the shape.
 */
export function drawShape(
    shape: 'triangle' | 'square' | 'circle' | 'pentagon',
    start: Point,
    end: Point,
    canvasWidth?: number,
    canvasHeight?: number
): Point[] {
    let points: Point[] = [];

    switch (shape) {
        case 'triangle':
            points = generateRegularPolygon(3, start, end);
            break;
        case 'square':
            points = generateRegularPolygon(4, start, end);
            break;
        case 'circle':
            points = generateCircle(start, end);
            break;
        case 'pentagon':
            points = generateRegularPolygon(5, start, end);
            break;
        default:
            // Should not happen if called correctly, but return empty array as fallback
            return [];
    }

    // Optional: Clamp points to canvas boundaries if dimensions are provided
    if (canvasWidth !== undefined && canvasHeight !== undefined) {
        points = points.map(p => ({
            x: Math.max(0, Math.min(p.x, canvasWidth)),
            y: Math.max(0, Math.min(p.y, canvasHeight)),
        }));
    }

    return points;
}
