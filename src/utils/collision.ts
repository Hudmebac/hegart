// src/utils/collision.ts

// Assuming Point is defined elsewhere or can be inlined
import { CircleHitbox, RectangleHitbox } from "../types/stickman";

export type HitboxShape = CircleHitbox | RectangleHitbox;

// Helper function to check collision between two circles
function circleCircleCollision(circle1: CircleHitbox, circle2: CircleHitbox): boolean {
    const dx = circle1.centerX - circle2.centerX;
    const dy = circle1.centerY - circle2.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
}

// Helper function to rotate a point around an origin
function rotatePoint(pointX: number, pointY: number, originX: number, originY: number, angleRad: number): { x: number; y: number } {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const translatedX = pointX - originX;
    const translatedY = pointY - originY;
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;
    return { x: rotatedX + originX, y: rotatedY + originY };
}

// Helper function to get the corners of a rotated rectangle
function getRectangleCorners(rect: RectangleHitbox): { x: number; y: number }[] {
    const originX = rect.x + rect.width / 2;
    const originY = rect.y + rect.height / 2;
    const angleRad = rect.rotation * (Math.PI / 180); // Convert degrees to radians

    const corners = [
        rotatePoint(rect.x, rect.y, originX, originY, angleRad),
        rotatePoint(rect.x + rect.width, rect.y, originX, originY, angleRad),
        rotatePoint(rect.x + rect.width, rect.y + rect.height, originX, originY, angleRad),
        rotatePoint(rect.x, rect.y + rect.height, originX, originY, angleRad)
    ];
    return corners;
}

// Helper function to get the axes of a rotated rectangle (for SAT)
function getRectangleAxes(rect: RectangleHitbox): { x: number; y: number }[] {
    const angleRad = rect.rotation * (Math.PI / 180);
    const axes = [
        { x: Math.cos(angleRad), y: Math.sin(angleRad) }, // Axis parallel to width
        { x: -Math.sin(angleRad), y: Math.cos(angleRad) } // Axis parallel to height
    ];
    return axes;
}

/**
 * Projects a shape (corners or circle) onto an axis.
 * Returns the min and max values of the projection.
 */
function projectShapeOntoAxis(shapeCorners: { x: number; y: number }[], axis: { x: number; y: number }): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    for (const corner of shapeCorners) {
        const projection = corner.x * axis.x + corner.y * axis.y;
        min = Math.min(min, projection);
        max = Math.max(max, projection);
    }
    return { min, max };
}

/**
 * Projects a circle onto an axis.
 */
function projectCircleOntoAxis(circle: CircleHitbox, axis: { x: number; y: number }): { min: number; max: number } {
    const centerProjection = circle.centerX * axis.x + circle.centerY * axis.y;
    return { min: centerProjection - circle.radius, max: centerProjection + circle.radius };
}

/**
 * Checks if two projections overlap on an axis.
 */
function isProjectionOverlapping(proj1: { min: number; max: number }, proj2: { min: number; max: number }): boolean {
    return Math.max(proj1.min, proj2.min) < Math.min(proj1.max, proj2.max);
}


/**
 * Checks collision between two rotated rectangles using the Separating Axis Theorem (SAT).
 */
function rectangleRectangleCollisionSAT(rect1: RectangleHitbox, rect2: RectangleHitbox): boolean {
    const corners1 = getRectangleCorners(rect1);
    const corners2 = getRectangleCorners(rect2);

    // Get all unique axes from both rectangles
    const axes = [...getRectangleAxes(rect1), ...getRectangleAxes(rect2)];

    // Check for separation on each axis
    for (const axis of axes) {
        const projection1 = projectShapeOntoAxis(corners1, axis);
        const projection2 = projectShapeOntoAxis(corners2, axis);

        if (!isProjectionOverlapping(projection1, projection2)) {
            // If there's a gap on any axis, there is no collision
            return false;
        }
    }

    // If no separating axis is found, the rectangles are colliding
    return true;
}

/**
 * Checks collision between a circle and a rotated rectangle using SAT.
 */
function circleRectangleCollisionSAT(circle: CircleHitbox, rect: RectangleHitbox): boolean {
     const rectCorners = getRectangleCorners(rect);

     // Get axes from the rectangle
     const axes = getRectangleAxes(rect);

     // Add an axis from the circle center to the closest vertex of the rectangle
     let closestVertex = rectCorners[0];
     let minDistSq = (circle.centerX - closestVertex.x)**2 + (circle.centerY - closestVertex.y)**2;
     for (let i = 1; i < rectCorners.length; i++) {
         const distSq = (circle.centerX - rectCorners[i].x)**2 + (circle.centerY - rectCorners[i].y)**2;
         if (distSq < minDistSq) {
             minDistSq = distSq;
             closestVertex = rectCorners[i];
         }
     }
     const axisToClosestVertex = { x: closestVertex.x - circle.centerX, y: closestVertex.y - circle.centerY };
     // Normalize the axis (avoid division by zero if circle center is on a vertex)
     const length = Math.sqrt(axisToClosestVertex.x**2 + axisToClosestVertex.y**2);
     if (length > 1e-5) { // Avoid division by very small numbers
          axes.push({ x: axisToClosestVertex.x / length, y: axisToClosestVertex.y / length });
     }

     // Check for separation on each axis
     for (const axis of axes) {
         const rectProjection = projectShapeOntoAxis(rectCorners, axis);
         const circleProjection = projectCircleOntoAxis(circle, axis);

         if (!isProjectionOverlapping(rectProjection, circleProjection)) {
             // If there's a gap on any axis, there is no collision
             return false;
         }
     }

     // If no separating axis is found, they are colliding
     return true;
}










/**
 * Checks for collision between two hitboxes using Separating Axis Theorem (SAT) for rectangles.
 *
 * @param hitbox1 The first hitbox.
 * @param hitbox2 The second hitbox.
 * @returns True if the hitboxes are colliding, false otherwise.
 */
/**
 * Checks for collision between two hitboxes.
 * Note: This implementation uses Separating Axis Theorem (SAT) for rotated rectangles.
 *
 * @param hitbox1 The first hitbox.
 * @param hitbox2 The second hitbox.
 * @returns True if the hitboxes are colliding, false otherwise.
 */
export function isColliding(hitbox1: HitboxShape, hitbox2: HitboxShape): boolean {
    if ('radius' in hitbox1 && 'radius' in hitbox2) {
        // Circle - Circle collision
        return circleCircleCollision(hitbox1, hitbox2);
    } else if ('width' in hitbox1 && 'width' in hitbox2) {
        // Rectangle - Rectangle collision (using simplified AABB)
        const aabb1 = getAABB(hitbox1);
        const aabb2 = getAABB(hitbox2);
        return aabbCollision(aabb1, aabb2); // Checking AABB collision
    } else if ('radius' in hitbox1 && 'width' in hitbox2) {
        // Circle - Rectangle collision (using simplified AABB)
        const aabb2 = getAABB(hitbox2);
        return circleAabbCollision(hitbox1, aabb2); // Checking Circle - AABB collision
    } else if ('width' in hitbox1 && 'radius' in hitbox2) {
        // Rectangle - Circle collision (using simplified AABB)
         const aabb1 = getAABB(hitbox1);
        return circleAabbCollision(hitbox2, aabb1); // Checking Circle - AABB collision
    }

    // Should not reach here if HitboxShape is strictly CircleHitbox | RectangleHitbox
    return false;
}