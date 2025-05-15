import { Stickman, AnimationLayer, LayerKeyframe, Keyframe, Animation, AnimatableProperty, Body, Head, Segment } from './types/stickman';
import { deepCloneStickmen } from './utils'; // Assuming you have a deep clone utility

// Helper function to interpolate a single stickman property
const interpolateProperty = (
    prop: AnimatableProperty,
    startValue: any,
    endValue: any,
    t: number
): any => {
    // Basic linear interpolation (can be extended for different property types)
    if (typeof startValue === 'number' && typeof endValue === 'number') {
        return startValue + (endValue - startValue) * t;
    }
    if (typeof startValue === 'object' && typeof endValue === 'object' && startValue !== null && endValue !== null) {
        // Assuming Point structure { x, y }
        if ('x' in startValue && 'y' in startValue && 'x' in endValue && 'y' in endValue) {
             return {
                 x: interpolateProperty('position', startValue.x, endValue.x, t),
                 y: interpolateProperty('position', startValue.y, endValue.y, t),
             };
         }
         // Add more complex object interpolation if needed (e.g., colors)
         return startValue; // Default to start value for unhandled object types
    }
    // Default to start value for unhandled types
    return startValue;
};


// Helper function to interpolate a single part (Body, Head, Segment) based on layer keyframe data
const interpolatePart = <T extends Body | Head | Segment>(
     basePart: T,
     startLayerPart: T | undefined,
     endLayerPart: T | undefined,
     t: number,
     propertiesToInterpolate: AnimatableProperty[] // Properties defined in the layer's scope
 ): T => {
     const interpolatedPart: any = deepCloneStickmen([basePart])[0]; // Start with a clone of the base part

     propertiesToInterpolate.forEach(prop => {
         // If both layer keyframes have the property, interpolate it
         if (startLayerPart && endLayerPart && prop in startLayerPart && prop in endLayerPart) {
             interpolatedPart[prop] = interpolateProperty(prop, (startLayerPart as any)[prop], (endLayerPart as any)[prop], t);
         } else if (startLayerPart && prop in startLayerPart) {
             // Only start layer keyframe has it, use start value
             interpolatedPart[prop] = (startLayerPart as any)[prop];
         } else if (endLayerPart && prop in endLayerPart) {
              // Only end layer keyframe has it, use end value
              interpolatedPart[prop] = (endLayerPart as any)[prop];
         }
         // If neither layer keyframe has the property, the basePart value is kept due to cloning
     });

     return interpolatedPart as T;
 };


/**
 * Interpolates the stickman pose at a given time, considering base pose and animation layers.
 * @param basePose The base pose of the stickmen.
 * @param layers The array of animation layers.
 * @param time The time at which to interpolate the pose.
 * @param duration The total duration of the animation (needed for time normalization).
 * @returns An array of Stickman objects representing the interpolated pose.
 */
export const interpolateStickmen = (
    basePose: Stickman[],
    layers: AnimationLayer[],
    time: number,
    duration: number // Duration is needed to normalize time for interpolation
): Stickman[] => {
    if (!basePose || basePose.length === 0) {
        return [];
    }

    // Start with a clone of the base pose at the given time (if basePose represents a single pose)
    // If basePose needs interpolation itself (e.g., from base keyframes), that logic would go here.
    // For now, assuming basePose is a fixed pose.
    let finalPose: Stickman[] = deepCloneStickmen(basePose);


    // Iterate through layers and apply their animation
    layers.forEach(layer => {
        if (!layer.isVisible) {
            return; // Skip invisible layers
        }

        // Find the two layer keyframes that the current time falls between
        const sortedLayerKeyframes = [...layer.keyframes].sort((a, b) => a.time - b.time);

        if (sortedLayerKeyframes.length === 0) {
            return; // Skip layers with no keyframes
        }

        let beforeLayerKeyframe: LayerKeyframe | null = null;
        let afterLayerKeyframe: LayerKeyframe | null = null;

        for (let i = 0; i < sortedLayerKeyframes.length; i++) {
            if (sortedLayerKeyframes[i].time <= time) {
                beforeLayerKeyframe = sortedLayerKeyframes[i];
            }
            if (sortedLayerKeyframes[i].time > time) {
                afterLayerKeyframe = sortedLayerKeyframes[i];
                break; // Found the 'after' keyframe, can stop searching
            }
        }

        let interpolatedLayerData: any = null; // Represents the interpolated state from this layer

        if (beforeLayerKeyframe === null && afterLayerKeyframe !== null) {
            // Time is before the first layer keyframe, use the first keyframe's data
            interpolatedLayerData = afterLayerKeyframe;
        } else if (beforeLayerKeyframe !== null && afterLayerKeyframe === null) {
            // Time is after the last layer keyframe, use the last keyframe's data
            interpolatedLayerData = beforeLayerKeyframe;
        } else if (beforeLayerKeyframe !== null && afterLayerKeyframe !== null) {
            // Time is between two layer keyframes, interpolate between them
            const timeRange = afterLayerKeyframe.time - beforeLayerKeyframe.time;
            const t = timeRange === 0 ? 0 : (time - beforeLayerKeyframe.time) / timeRange;

            // Interpolate the layer data based on its scope and the properties it animates
            // Assumes LayerKeyframe stores partial Stickman data keyed by stickman ID
             interpolatedLayerData = {};
             finalPose.forEach(stickman => {
                  const stickmanId = stickman.id;

                 // Check if this stickman is affected by this layer's scope
                 if (layer.scope.partIds && !layer.scope.partIds.includes(stickmanId)) {
                     return; // Stickman not in layer scope
                 }
                  const startStickmanData = beforeLayerKeyframe ? beforeLayerKeyframe[stickmanId] : undefined;
                  const endStickmanData = afterLayerKeyframe ? afterLayerKeyframe[stickmanId] : undefined;


                       // Interpolate Body
                       if (stickman.body) {
                            const startBody = startStickmanData?.body;
                            const endBody = endStickmanData?.body;
                            interpolatedLayerData[stickmanId].body = interpolatePart(stickman.body, startBody, endBody, t, layer.scope.properties || []);
                       }

                       // Interpolate Head
                        if (stickman.head) {
                             const startHead = startStickmanData?.head;
                             const endHead = endStickmanData?.head;
                             interpolatedLayerData[stickmanId].head = interpolatePart(stickman.head, startHead, endHead, t, layer.scope.properties || []);
                        }

                       // Interpolate Segments (Limbs)
                       if (stickman.limbs) {
                            interpolatedLayerData[stickmanId].limbs = stickman.limbs.map(limb => {
                                 return limb.map(segment => {
                                      const segmentId = segment.id; // Assuming segment has an ID
                                       const startSegment = startStickmanData?.limbs
                                            ?.flat()
                                            .find((s: any) => s.id === segmentId); // Use any to access id
                                       const endSegment = endStickmanData?.limbs
                                             ?.flat()
                                            .find((s: Segment) => s.id === segmentId);

                                     return interpolatePart(segment, startSegment, endSegment, t, layer.scope.properties || []);
                                 });
                            });
                       }
                  }
            });
            // If after interpolation, no data was added for any stickman, set to null
             if (Object.keys(interpolatedLayerData).length === 0) {
                 interpolatedLayerData = null;
             }

        } else if (beforeLayerKeyframe !== null && afterLayerKeyframe === null) {
             // Time is after the last keyframe, use the last keyframe's state
             interpolatedLayerData = beforeLayerKeyframe;
        } else {
             // No keyframes or time is before the first
            // Use the base pose values for parts covered by this layer's scope if no layer keyframes are found
            interpolatedLayerData = {};
        }


        // Apply the interpolated layer data to the final pose based on blend mode and scope
        if (interpolatedLayerData) {
            finalPose = finalPose.map(stickman => {
                 const stickmanId = stickman.id;
                 const layerStickmanData = interpolatedLayerData[stickmanId];

                 if (!layerStickmanData) {
                     return stickman; // No interpolated data for this stickman in this layer
                 }

                const updatedStickman = deepCloneStickmen([stickman])[0]; // Clone to modify

                 // Apply layer data based on blend mode and scope
                 if (layer.blendMode === 'override') {
                     // For 'override', replace the entire part data if it exists in the layer keyframe
                     // Ensure the part is also within the layer's scope if scope.partIds is defined

                     if (layerStickmanData.body && updatedStickman.body && (!layer.scope.partIds || layer.scope.partIds.includes(updatedStickman.body.id))) {
                         updatedStickman.body = layerStickmanData.body; // Replace body
                     }
                      if (layerStickmanData.head && updatedStickman.head && (!layer.scope.partIds || layer.scope.partIds.includes(updatedStickman.head.id))) {
                         updatedStickman.head = layerStickmanData.head; // Replace head
                      }
                      if (layerStickmanData.limbs && updatedStickman.limbs) {
                          updatedStickman.limbs = updatedStickman.limbs.map(limb => {
                              return limb.map(segment => {
                                   const layerSegment = layerStickmanData.limbs
                                        .flat()
                                        .find((s: Segment) => s.id === segment.id);
                                   // Only override the segment if layer data exists for it AND it's in scope (if scope is defined)
                                   if (layerSegment && (!layer.scope.partIds || layer.scope.partIds.includes(segment.id))) {
                                       return layerSegment; // Replace segment
                                    }
                                   return segment; // No layer data or not in scope, keep base
                               });
                           });
                     } else {
                         // Handle cases where layer scopes by specific part IDs within a stickman
                          // This would require more complex logic to match layer data to specific part IDs
                         console.warn("Layer scope by specific part IDs within a stickman not fully implemented.");
                          // For now, if scope.partIds is present, but doesn't include the stickman ID, skip.
                          // If scope.partIds is present and includes stickman ID, the above logic should apply.
                     }
                 }
                 // Add logic for other blend modes ('additive', etc.) here later

                 return updatedStickman;
            });
        }
    });

    return finalPose;
};

// Assuming deepCloneStickmen is defined elsewhere, e.g., in utils.ts
// Example basic implementation:
/*
import { Stickman, Body, Head, Segment, Limb } from './types/stickman';

export const deepCloneStickmen = (stickmen: Stickman[]): Stickman[] => {
    return stickmen.map(stickman => ({
        ...stickman,
        body: stickman.body ? { ...stickman.body } : undefined,
        head: stickman.head ? { ...stickman.head } : undefined,
        limbs: stickman.limbs ? stickman.limbs.map(limb =>
            limb.map(segment => ({ ...segment }))
        ) : undefined,
    }));
};
*/