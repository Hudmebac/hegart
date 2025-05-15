// src/App.tsx

import React, { useState, useEffect } from 'react';
// import AnimationManager from './components/AnimationManager'; // Removed AnimationManager as Timeline is replacing its role
import StickmanCanvas from './components/StickmanCanvas'; // Assuming StickmanCanvas is imported here
import { Stickman, AnimationState, Animation, Keyframe, Point } from './types/stickman';
import { GameItem } from './types/game'; // Import GameItem type
import LayerPanel from './components/LayerPanel'; // Import the LayerPanel component
import Timeline from './components/Timeline'; // Import the Timeline component
import { saveStickman, loadStickmen } from './utils/storage';
import GameItemPanel from './components/GameItemPanel'; // Import GameItemPanel
import { sampleGameItems } from './data/gameItems'; // Import sample game items
import { calculateDamage } from './gameLogic/gameLogic'; // Import damage calculation function
import { getDistance } from './utils/math'; // Import getDistance function
import { CREDITS_PER_DEFEAT } from './constants/gameConstants'; // Import credit constant
import { RecordedFrame } from './types/recording'; // Import RecordedFrame
import { EquippedItem, Weapon, FightRecording } from './types/stickman'; // Import EquippedItem and Weapon types
import ShopPanel from './components/ShopPanel'; // Import the ShopPanel component

    const [stickmen, setStickmen] = useState<Stickman[]>([]);
 const [selectedStickmanId, setSelectedStickmanId] = useState<string | null>(null); // State for selected stickman
    const [animationState, setAnimationState] = useState<AnimationState>({
        animations: [],
        currentAnimationId: null, // Will be set in useEffect
        currentTime: 0,
        isPlaying: false,
        currentLayerId: null, // Add state for current layer
    });
    // State to track the currently selected item for equipping
 const [selectedItemIdForEquipping, setSelectedItemIdForEquipping] = useState<string | null>(null); // Use item ID
    const [filename, setFilename] = useState(''); // State for save filename

 const [playerCredits, setPlayerCredits] = useState<number>(0); // State for player credits
    // State for recording
    const [isRecording, setIsRecording] = useState(false);
    const [currentRecordingFrames, setCurrentRecordingFrames] = useState<RecordedFrame[]>([]);
    const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
    const [savedRecordingIds, setSavedRecordingIds] = useState<string[]>([]); // State to list saved recordings

    const [playerInventory, setPlayerInventory] = useState<GameItem[]>([]); // State for player inventory
    // Initial stickman and animation setup
    useEffect(() => {
        const initialStickman: Stickman = {
 health: 100, // Initialize health
 maxHealth: 100, // Set a default max health
            id: 'stickman-1',
            name: 'Default Stickman',
            body: {
                id: 'body-1',
                name: 'Body',
                position: { x: 400, y: 300 },
                rotation: 0,
                width: 40,
                height: 80,
                thickness: 10,
                strokeStyle: 'green',
                lineWidth: 12,
                connectionPoints: {
                    head: { x: 0, y: -40 },
                    'right-arm': { x: 20, y: -30 },
                    'left-arm': { x: -20, y: -30 },
                    'right-leg': { x: 10, y: 40 },
                    'left-leg': { x: -10, y: 40 },
                },
                minPosition: { x: 0, y: 0 },
                maxPosition: { x: 800, y: 600 },
                minRotation: -Math.PI / 4,
                maxRotation: Math.PI / 4,
            },
            head: {
                id: 'head-1',
                name: 'Head',
                position: { x: 0, y: -20 },
                radius: 15,
                thickness: 8,
                strokeStyle: 'orange',
                lineWidth: 10,
                minRotation: -Math.PI / 2,
                maxRotation: Math.PI / 2,
            },
            limbs: [
                {
                    id: 'right-arm',
                    type: 'arm',
                    name: 'Right Arm',
                    connectionPoint: { x: 20, y: -30 },
                    segments: [
                        {
                            id: 'right-upper-arm',
                            name: 'Upper Arm',
                            length: 30,
                            thickness: 5,
                            rotation: Math.PI / 4,
                            position: { x: 0, y: 0 },
                            strokeStyle: 'purple',
                            lineWidth: 6,
                        },
                        {
                            id: 'right-forearm',
                            name: 'Forearm',
                            length: 30,
                            thickness: 5,
                            rotation: Math.PI / 4,
                            position: { x: 0, y: 0 },
                            minRotation: -Math.PI * 0.8,
                            maxRotation: Math.PI * 0.1,
                        },
                    ],
                },
                // Add Left Arm, Legs...
            ],
        };

        // Create a base pose from the initial stickman
        const basePose: Stickman[] = [initialStickman];

        // Create a default 'Base Layer' with override blend mode
        const defaultLayerId = 'layer-base';
        const defaultLayer = {
            id: defaultLayerId,
            name: 'Base Layer',
            blendMode: 'override' as const, // Use 'override' blend mode
            opacity: 1.0,
            isVisible: true,
            isLocked: false,
            scope: {}, // Initially scope all parts/properties (or specific ones if needed)
            keyframes: [], // Layers start with no keyframes, they are added during animation
        };

        // Create a default animation
        const defaultAnimation: Animation = {
            id: 'animation-1',
            name: 'Default Animation',
            duration: 5000, // 5 seconds duration
            keyframes: [], // Base keyframes might not be needed if using basePose and layers
            layers: [defaultLayer], // Include the default layer
            basePose: basePose, // Set the base pose
        };

        setAnimationState({
            animations: [defaultAnimation],
            currentAnimationId: defaultAnimation.id,
            currentTime: 0,
            isPlaying: false,
            currentLayerId: defaultLayerId, // Set the current layer ID
        });

        // Set the initial stickmen state from the base pose or interpolated pose at time 0
        // We'll need the interpolate function updated to handle layers
        // For now, set to base pose initially
        setStickmen(basePose);

 setSelectedStickmanId(initialStickman.id); // Select the initial stickman

    }, []);

    // Function to interpolate stickmen pose based on current animation state
    const interpolateStickmen = (animation: Animation, time: number): Stickman[] => {
        // Start with the base pose
        let interpolatedPose = JSON.parse(JSON.stringify(animation.basePose)); // Deep copy base pose

        // Apply layers in order (assuming layers array is ordered bottom-up)
        animation.layers.forEach(layer => {
            if (!layer.isVisible) return;

            // Find keyframes bracketing the current time for this layer
            const beforeKeyframeIndex = layer.keyframes.reduce((prevIndex, currentKeyframe, index) => {
                return currentKeyframe.time <= time ? index : prevIndex;
            }, 0);

            const beforeKeyframe = layer.keyframes[beforeKeyframeIndex];
            const afterKeyframe = layer.keyframes[beforeKeyframeIndex + 1];

            let layerAppliedPose: Stickman[];

            if (!beforeKeyframe) {
                 // No keyframes in this layer yet or time is before first keyframe
                 // The pose remains unchanged by this layer
                 layerAppliedPose = interpolatedPose;
            } else if (!afterKeyframe || beforeKeyframe === afterKeyframe) {
                // Only one keyframe or time is at or after the last keyframe
                // Apply the state from the single keyframe or the last keyframe
                // Assuming LayerKeyframe stores partial Stickman state for the scoped parts
                layerAppliedPose = applyLayerKeyframeToPose(interpolatedPose, beforeKeyframe);

            } else {
                 // Interpolate between before and after keyframes
                const timeRange = afterKeyframe.time - beforeKeyframe.time;
                const t = (time - beforeKeyframe.time) / timeRange;

                // Interpolate the state between the two layer keyframes
                const interpolatedLayerState = interpolateLayerStates(beforeKeyframe, afterKeyframe, t);

                // Apply the interpolated state to the current pose
                layerAppliedPose = applyLayerKeyframeToPose(interpolatedPose, { time, ...interpolatedLayerState });
            }

            // Blend the layerAppliedPose with the current interpolatedPose based on blend mode and opacity
            // This is a simplified blend - just overriding for now based on scope
             if (layer.blendMode === 'override') {
                 // For override, replace the parts/properties in the interpolatedPose
                 // with the corresponding ones from layerAppliedPose IF they are in the layer's scope
                 if (layer.scope.partIds && layer.scope.partIds.length > 0) {
                     interpolatedPose = interpolatedPose.map(stickman => {
                          const updatedStickman = { ...stickman };
                          // Find the corresponding stickman in the layerAppliedPose (assuming same structure)
                          const layerStickman = layerAppliedPose.find(ls => ls.id === stickman.id);

                          if (layerStickman) {
                              // Iterate through the stickman's parts
                               if (layer.scope.partIds.includes(stickman.body.id)) updatedStickman.body = layerStickman.body;
                               if (layer.scope.partIds.includes(stickman.head.id)) updatedStickman.head = layerStickman.head;

                                updatedStickman.limbs = updatedStickman.limbs.map(limb => {
                                     if (layer.scope.partIds && layer.scope.partIds.includes(limb.id)) return layerStickman.limbs.find(ll => ll.id === limb.id) || limb;

                                     limb.segments = limb.segments.map(segment => {
                                         if (layer.scope.partIds && layer.scope.partIds.includes(segment.id)) return layerStickman.limbs.find(ll => ll.id === limb.id)?.segments.find(ls => ls.id === segment.id) || segment;
                                         return segment;
                                     });
                                     return limb;
                                });
                          }
                         return updatedStickman;
                     });
                 } else {
                     // If no specific parts are scoped, override the whole pose (simplified)
                     // This needs refinement based on what the layer keyframe actually stores
                     interpolatedPose = layerAppliedPose;
                 }
             }
             // Add logic for 'additive' and other blend modes later

        });

        return interpolatedPose;
    };

    // Helper function to find the closest stickman target for AI
    const findClosestTarget = (aiStickman: Stickman, allStickmen: Stickman[]): string | null => {
        let closestTargetId: string | null = null;
        let minDistance = Infinity;

        const potentialTargets = allStickmen.filter(
            target => !target.isAI && (target.health === undefined || target.health > 0) // Target is not AI and is alive
        );

        for (const target of potentialTargets) {
            const distance = Math.sqrt(
                Math.pow(aiStickman.body.position.x - target.body.position.x, 2) +
                Math.pow(aiStickman.body.position.y - target.body.position.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestTargetId = target.id;
            }
        }
        return closestTargetId;
    };

    // Helper function to apply state from a LayerKeyframe to a Stickman pose
    // This assumes the LayerKeyframe stores partial Stickman structures corresponding to its scope
     const applyLayerKeyframeToPose = (pose: Stickman[], layerKeyframe: LayerKeyframe): Stickman[] => {
        // This function needs to merge the state from layerKeyframe into the pose.
        // The structure of layerKeyframe.data will determine how this merge happens.
        // For now, assuming layerKeyframe.data might contain stickman objects or parts

        return pose.map(stickman => {
            const updatedStickman = { ...stickman };

             // Assuming layerKeyframe might have a 'stickmen' property with relevant data
             if (layerKeyframe.stickmen) {
                 const layerStickmanData = layerKeyframe.stickmen.find((ls: any) => ls.id === stickman.id);
                 if (layerStickmanData) {
                     // Merge data from layerStickmanData into updatedStickman
                     // This requires merging properties within body, head, limbs, segments based on layer scope
                      // This is complex and needs careful implementation based on layer scope and data structure
                      // For the initial override layer, assuming the keyframe might contain full stickman data for simplicity
                      return layerStickmanData; // Simplified: directly use data from keyframe if it contains full stickman
                 }
             }

            return updatedStickman;
        });
    };

    // Helper function to interpolate between two LayerKeyframe states
    const interpolateLayerStates = (kf1: LayerKeyframe, kf2: LayerKeyframe, t: number): any => {
         // This function needs to interpolate the data structure stored in LayerKeyframe
         // based on the layer's scope.
         // For the initial override layer, assuming keyframes store full stickman data for simplicity,
         // we can reuse the existing stickman interpolation logic.
         return interpolateStickmen([{ time: kf1.time, stickmen: kf1.stickmen as Stickman[] }], { time: kf2.time, stickmen: kf2.stickmen as Stickman[] }, t)[0]; // Assuming keyframes store stickmen
    };


    // Update the stickmen state whenever currentTime or animationState changes
    useEffect(() => {
 const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);

        // Define AI movement speed and attack distance threshold
        const aiMovementSpeed = 0.5; // Units per update
        const aiAttackDistance = 50; // Distance threshold to transition to attacking

        if (currentAnimation) {
            // AI Update Logic (moved here for now, will need a proper game loop)
            const updatedStickmenForAI = currentAnimation.basePose.map(stickman => {
                if (stickman.isAI) {
                    // If no target or target is invalid, find a new target
 const target = currentAnimation.basePose.find(t => t.id === stickman.targetId);
 const aiStickmanInBasePose = currentAnimation.basePose.find(s => s.id === stickman.id);

                    // Find target if needed
                    if (!stickman.targetId || !target || (target.health !== undefined && target.health <= 0) || !aiStickmanInBasePose) {
 const newTargetId = findClosestTarget(stickman, currentAnimation.basePose);
                        if (newTargetId) {
 console.log(`AI Stickman ${stickman.id} targeting ${newTargetId}`);
                            return { ...stickman, targetId: newTargetId, aiState: 'attacking' }; // Set to attacking when target found
                        } else {
                            return { ...stickman, targetId: null, aiState: 'idle' }; // Go idle if no target
                        }
                    }

                    // AI behavior based on state
                    switch (stickman.aiState) {
                        case 'idle':
                            // AI stays idle until a target is found
                            break;
                        case 'attacking':
                            // AI Movement: Move towards the target
                            if (target) {
                                const aiPosition = stickman.body.position;
                                const targetPosition = target.body.position;

                                const distanceToTarget = getDistance(aiPosition, targetPosition);

                                if (distanceToTarget > aiAttackDistance) {
                                    // Calculate direction vector
                                    const directionX = targetPosition.x - aiPosition.x;
                                    const directionY = targetPosition.y - aiPosition.y;

                                    // Normalize direction vector
                                    const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
                                    const normalizedDirectionX = magnitude > 0 ? directionX / magnitude : 0;
                                    const normalizedDirectionY = magnitude > 0 ? directionY / magnitude : 0;

                                    // Apply movement
                                    const newPositionX = aiPosition.x + normalizedDirectionX * aiStickmanInBasePose.speed; // Use AI stickman's speed
                                    const newPositionY = aiPosition.y + normalizedDirectionY * aiMovementSpeed;

                                    return {
                                        ...stickman,
                                        body: { ...stickman.body, position: { x: newPositionX, y: newPositionY } }
                                    };
                                } else {
                                    // Close enough to attack, transition to attacking state (will implement attack logic later)
 console.log(`AI Stickman ${stickman.id} is close enough to attack ${target.id}.`);
                                    // For now, just log and remain in 'attacking' state
                                    // return { ...stickman, aiState: 'attacking' }; // Already in attacking, no state change needed here
                                }
                            }
                            break;
                        case 'defending':
                            // AI logic for defending (will be implemented later)
                            break;
                        default:
                            break;
                    }
                }
                return stickman; // No change for non-AI stickmen or AI with valid target
            });

 // Combine stickmen from updatedBasePose with any stickmen not in basePose (though currently all stickmen are in basePose)
            const allStickmenInAnimation = [...updatedStickmenForAI]; // For simplicity, assume all stickmen are in basePose


            // Use the updated stickmen (with potential AI movements) for interpolation
            const interpolatedStickmen = interpolateStickmen({ ...currentAnimation, basePose: updatedStickmenForAI }, animationState.currentTime);
            setStickmen(interpolatedStickmen);
        } else {
             // If no animation is selected, perhaps show the base pose or an empty state
             setStickmen([]); // Or animationState.animations[0]?.basePose || []
        }
    }, [animationState.currentTime, animationState.currentAnimationId, animationState.animations]); // Depend on currentTime and animation state

 // Add dependency on stickmen state itself so AI movement triggers re-render and further AI updates


    // Handle drag updates
    const handleStickmanUpdate = (updatedStickmen: Stickman[]) => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation || prevState.currentLayerId === null) return prevState; // Only update if animation and layer are selected

            const currentLayer = currentAnimation.layers.find(layer => layer.id === prevState.currentLayerId);
            if (!currentLayer || currentLayer.isLocked) return prevState; // Only update if layer is found and not locked

            const currentTime = prevState.currentTime;
            const existingKeyframeIndex = currentLayer.keyframes.findIndex(kf => kf.time === currentTime);

            // Create a LayerKeyframe storing only the state of the modified parts
            const modifiedPartData: { [partId: string]: any } = {};
            // You would need to compare updatedStickmen with the interpolated pose *before* this layer was applied
            // to identify exactly which parts changed and store their new state.
            // For simplicity in this diff, we'll just assume updatedStickmen contains the parts you want to keyframe.
            // A more robust implementation would track individual part modifications.
            updatedStickmen.forEach(stickman => {
                 // This part needs refinement based on how you track *which* parts were modified by the user drag
                 // For demonstration, let's assume updatedStickmen[0] is the relevant stickman
                 // and we're capturing its body and head state. This is a simplification.
                 if (stickman.body) modifiedPartData[stickman.body.id] = { position: stickman.body.position, rotation: stickman.body.rotation };
                 if (stickman.head) modifiedPartData[stickman.head.id] = { position: stickman.head.position, rotation: stickman.head.rotation }; // Assuming head has position/rotation
                 // Add similar logic for limbs and segments based on your UI's modification tracking
            });
            const newLayerKeyframe: LayerKeyframe = {
                time: currentTime,
                data: modifiedPartData, // Store only the modified part data
            };

            let updatedKeyframes: LayerKeyframe[];

            if (existingKeyframeIndex !== -1) {
                // Update existing keyframe
                updatedKeyframes = [
                    ...currentLayer.keyframes.slice(0, existingKeyframeIndex),
                    newLayerKeyframe,
                    ...currentLayer.keyframes.slice(existingKeyframeIndex + 1),
                ];
            } else {
                // Add new keyframe and sort
                updatedKeyframes = [...currentLayer.keyframes, newLayerKeyframe].sort((a, b) => a.time - b.time);
            }

            // Update the current layer with the new keyframes
            const updatedLayer = {
                ...currentLayer,
                keyframes: updatedKeyframes,
            };

            // Update the animation with the modified layer
            const updatedAnimation = {
                ...currentAnimation,
                layers: currentAnimation.layers.map(layer =>
                    layer.id === updatedLayer.id ? updatedLayer : layer
                ),
            };

            // Update the animation state
            const updatedAnimations = prevState.animations.map(anim =>
                anim.id === updatedAnimation.id ? updatedAnimation : anim
            );

            return {
                ...prevState,
                animations: updatedAnimations,
            };
        });
         // The stickmen state will be updated by the useEffect hook when animationState changes
    };

    // Handle Layer Panel actions
    const handleSelectLayer = (layerId: string) => {
        setAnimationState(prevState => ({
            ...prevState,
            currentLayerId: layerId,
         }));
    };

    // Game loop / Update logic (simplified here, might be in a useFrameLoop hook)
    useEffect(() => {
        if (animationState.isPlaying && isRecording && recordingStartTime !== null) {
            const currentTime = Date.now();
            const elapsed = currentTime - recordingStartTime;

            // Capture stickman state for recording
            const recordedStickmenState = stickmen.map(s => ({
                id: s.id,
                pose: s.body.position, // Simplified: just record body position
 health: s.health, // Record health
            }));

            const newFrame: RecordedFrame = {
 time: elapsed,
 stickmen: recordedStickmenState,
            };
            setCurrentRecordingFrames(prevFrames => [...prevFrames, newFrame]);
        }));
    };

    const handleAddLayer = () => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation) return prevState;

            const newLayerId = `layer-${Date.now()}`; // Simple unique ID
            const newLayer = {
                id: newLayerId,
                name: `Layer ${currentAnimation.layers.length + 1}`,
                blendMode: 'override' as const, // Default to override for now
                opacity: 1.0,
                isVisible: true,
                isLocked: false,
                scope: {}, // Default scope
                keyframes: [],
            };

            const updatedLayers = [...currentAnimation.layers, newLayer];
            const updatedAnimation = {
                ...currentAnimation,
                layers: updatedLayers,
            };

            const updatedAnimations = prevState.animations.map(anim =>
                anim.id === updatedAnimation.id ? updatedAnimation : anim
            );

            return {
                ...prevState,
                animations: updatedAnimations,
                currentLayerId: newLayerId, // Select the new layer
            };
        });
    };

    const handleDeleteLayer = (layerId: string) => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation || currentAnimation.layers.length <= 1) return prevState; // Prevent deleting the last layer

            const updatedLayers = currentAnimation.layers.filter(layer => layer.id !== layerId);
            const updatedAnimation = {
                ...currentAnimation,
                layers: updatedLayers,
            };
            const updatedAnimations = prevState.animations.map(anim =>
                anim.id === updatedAnimation.id ? updatedAnimation : anim
            );
            const newCurrentLayerId = prevState.currentLayerId === layerId ? updatedLayers[0]?.id || null : prevState.currentLayerId; // Select first layer if current is deleted
            return { ...prevState, animations: updatedAnimations, currentLayerId: newCurrentLayerId };
        });
    };
    // Timeline scrub handler (simplified since Timeline component handles the slider now)
    const handleTimelineScrub = (time: number) => {
         setAnimationState(prevState => ({
             ...prevState,
             currentTime: time,
         }));


    }, [animationState.currentTime, animationState.currentAnimationId, animationState.animations]);

    // Placeholder functions for basic part manipulation (replace with proper UI later)
    const handleAddLimb = () => {
        // Logic to add a new limb to the current stickman's base pose
        // This is simplified and needs proper implementation
        console.log("Add Limb clicked (placeholder)");
    };

     const handleAddSegment = () => {
        // Logic to add a new segment to a selected limb's base pose
         // This is simplified and needs proper implementation
        console.log("Add Segment clicked (placeholder)");
    };

     const handleRemovePart = () => {
        // Logic to remove a selected part from the current stickman's base pose
         // This is simplified and needs proper implementation
        console.log("Remove Part clicked (placeholder)");
    };

    // Placeholder Save/Load Handlers (replace with proper implementation using layers)
    const handleSaveStickman = () => {
        if (!filename || !animationState.currentAnimationId) {
            console.warn("Please enter a filename and ensure an animation is selected.");
            return;
        }
         const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);
         if (currentAnimation) {
             // Saving needs to include layers and basePose now
             saveStickman(filename, currentAnimation); // Need to update saveStickman to handle Animation type
             console.log(`Animation '${currentAnimation.name}' saved as ${filename}`);
         }
    };

    const handleLoadStickmen = async () => {
        if (!filename) {
             console.warn("Please enter a filename to load.");
             return;
        }
        try {
            const loadedAnimation: Animation | null = await loadStickmen(filename) as Animation | null; // Need to update loadStickmen to return Animation type
            if (loadedAnimation) {
                // Add loaded animation to state
                 setAnimationState(prevState => {
                     // Check if animation with same ID already exists
                     const existingIndex = prevState.animations.findIndex(anim => anim.id === loadedAnimation.id);

                     let updatedAnimations;
                     if (existingIndex !== -1) {
                         // Replace existing animation
                         updatedAnimations = [
                             ...prevState.animations.slice(0, existingIndex),
                             loadedAnimation,
                             ...prevState.animations.slice(existingIndex + 1),
                         ];
                     } else {
                         // Add new animation
                        updatedAnimations = [...prevState.animations, loadedAnimation];
                     }

                     // Set loaded animation as current
                     const firstLayerId = loadedAnimation.layers.length > 0 ? loadedAnimation.layers[0].id : null;

                     return {
                         ...prevState,
                         animations: updatedAnimations,
                         currentAnimationId: loadedAnimation.id,
                         currentLayerId: firstLayerId, // Select the first layer of the loaded animation
                         currentTime: 0, // Reset time
                     };
                 });
                 console.log(`Animation '${loadedAnimation.name}' loaded.`);
            } else {
                 console.warn(`No animation found with filename: ${filename}`);
            }
        } catch (error) {
             console.error("Failed to load animation:", error);
             console.warn(`Could not load animation from filename: ${filename}`);
        }
    };

    // Handle item equipping selection
 const handleEquipItem = (itemId: string) => {
 setSelectedItemIdForEquipping(itemId);
 const item = sampleGameItems.find(i => i.id === itemId);
 console.log(`Selected item to equip: ${item?.name}. Click on a stickman part in the canvas to attach it.`);
    };

 // Handle click on a stickman part for equipping
 const handleStickmanPartClick = (stickmanId: string, partId: string, isDamagingCollision = false, attackingItemId: string | null = null) => {
 if (selectedItemIdForEquipping === null) {
 // If no item is selected for equipping, maybe select the stickman
 setSelectedStickmanId(stickmanId);
 console.log(`Stickman ${stickmanId}, Part ${partId} clicked.`);

 // Basic placeholder for demonstrating damage calculation
 if (isDamagingCollision && attackingItemId !== null) {
            const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);
            const targetStickman = currentAnimation?.basePose.find(s => s.id === stickmanId);
            const targetPart = targetStickman?.body.id === partId ? targetStickman.body :
 targetStickman?.head.id === partId ? targetStickman.head :
 targetStickman?.limbs.flatMap(limb => limb.segments).find(segment => segment.id === partId);
            const attackingItem = sampleGameItems.find(item => item.id === attackingItemId && item.type === 'weapon') as Weapon | undefined;

 if (targetStickman && targetPart && attackingItem) {
 const damageDealt = calculateDamage(attackingItem, targetStickman); // Pass attacker (item owner) and defender
 console.log(`Collision detected! Stickman ${stickmanId} hit in part ${partId} by ${attackingItem.name}. Damage dealt: ${damageDealt}`);
 // Check if the stickman is already defeated to prevent awarding credits multiple times
 if (targetStickman.health > 0 && targetStickman.health - damageDealt <= 0 && targetStickman.isAI) {
 console.log(`AI Stickman ${stickmanId} defeated! Awarding ${CREDITS_PER_DEFEAT} credits.`);
 setPlayerCredits(prevCredits => prevCredits + CREDITS_PER_DEFEAT);
 }

 // Apply damage to the stickman's health
                // Apply damage to the stickman's health
 setAnimationState(prevState => {
                    const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(s => {
 if (s.id === stickmanId) {
 const newHealth = Math.max(0, s.health - damageDealt); // Health doesn't go below 0
 if (newHealth <= 0) {
 console.log(`Stickman ${stickmanId} has been defeated!`);
 }
 return { ...s, health: newHealth };
                                    }
 return s;
                                });
 return { ...anim, basePose: updatedBasePose };
                            }
 return anim;
                        });
 return { ...prevState, animations: updatedAnimations };
                    });
 }
        }
 return; // Exit if not equipping
        }

 // Item is selected for equipping, equip it to the clicked part
 setAnimationState(prevState => {
 const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(stickman => {
 if (stickman.id === stickmanId) {
 // Find the part to attach to (could be body, head, or limb segment)
                                 // This is a simplified check, needs to handle limbs/segments properly
 const targetPart = stickman.body.id === partId ? stickman.body :
 stickman.head.id === partId ? stickman.head :
 stickman.limbs.flatMap(limb => limb.segments).find(segment => segment.id === partId);

 if (targetPart) {
 const newItem = { itemId: selectedItemIdForEquipping, attachedToPartId: partId };
                                     // Add the item to the stickman's equippedItems array
 return { ...stickman, equippedItems: [...(stickman.equippedItems || []), newItem] };
                                 }
                            }
 return stickman;
                        });
 return { ...anim, basePose: updatedBasePose }; // Update the base pose with the equipped item
                    }
 return anim;
                });
            return { ...prevState, animations: updatedAnimations };
        });
 setSelectedItemIdForEquipping(null); // Reset selected item after equipping
 console.log(`Equipped item ${selectedItemIdForEquipping} to part ${partId} on stickman ${stickmanId}.`);
    };

    // Handle buying an item from the shop
    const handleBuyItem = (itemId: string) => {
        const itemToBuy = sampleGameItems.find(item => item.id === itemId);

 if (!itemToBuy) {
            console.warn(`Item with ID ${itemId} not found.`);
 return;
        }

 if (playerCredits >= itemToBuy.cost) {
            // Deduct credits
 setPlayerCredits(prevCredits => prevCredits - itemToBuy.cost);
            // Add item to inventory
 setPlayerInventory(prevInventory => [...prevInventory, itemToBuy]);
 console.log(`Successfully bought ${itemToBuy.name} for ${itemToBuy.cost} credits.`);
 console.log(`Current credits: ${playerCredits - itemToBuy.cost}`); // Log updated credits
 console.log('Inventory:', [...playerInventory, itemToBuy]); // Log updated inventory
        } else {
            console.warn(`Insufficient credits to buy ${itemToBuy.name}. Need ${itemToBuy.cost}, have ${playerCredits}.`);
        }
    };

    // Handle unequipping an item
    const handleUnequipItem = (itemId: string) => {
 setAnimationState(prevState => {
 const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(stickman => {
 if (stickman.equippedItems) {
 // Filter out the equipped item with the matching ID
 const updatedEquippedItems = stickman.equippedItems.filter(
 (equippedItem: EquippedItem) => equippedItem.itemId !== itemId
 );
 // If the equippedItems array actually changed, update the stickman
 if (updatedEquippedItems.length < stickman.equippedItems.length) {
 console.log(`Unequipped item ${itemId} from stickman ${stickman.id}.`);
                                             return {
 ...stickman,
 equippedItems: updatedEquippedItems,
                                             };
                                         }
 }
 return stickman; // No change for this stickman
                            });
 return { ...anim, basePose: updatedBasePose }; // Update the base pose
                        }
 return anim; // No change for this animation
                    });
 return { ...prevState, animations: updatedAnimations };
                });
    };

    // Start Recording
    const startRecording = () => {
 setIsRecording(true);
 setRecordingStartTime(Date.now());
 setCurrentRecordingFrames([]); // Clear previous recording
 console.log("Recording started.");
    };

    // Stop Recording
    const stopRecording = () => {
 setIsRecording(false);
 const duration = recordingStartTime ? Date.now() - recordingStartTime : 0;

 // Create FightRecording object
 const recordingId = `recording-${Date.now()}`; // Simple unique ID
 const fightRecording: FightRecording = {
 id: recordingId,
 timestamp: Date.now(),
 duration: duration,
 frames: currentRecordingFrames,
        };
 console.log(`Recording stopped. Duration: ${duration}ms. Captured ${currentRecordingFrames.length} frames.`);
        console.log("Recorded Frames:", currentRecordingFrames); // For inspection
 setRecordingStartTime(null);
    };

 // Determine which items are equipped across all stickmen in the current animation
    // Save the recording to local storage
    try {
        const recordingJson = JSON.stringify(fightRecording);
        localStorage.setItem(`fightRecording_${recordingId}`, recordingJson);
        setSavedRecordingIds(prevIds => [...prevIds, recordingId]); // Add to list of saved IDs
        console.log(`Recording ${recordingId} saved to local storage.`);
    } catch (error) {
        console.error("Failed to save recording to local storage:", error);
    }
    };

    // Load Recording
    const loadRecording = (recordingId: string): FightRecording | null => {
        try {
            const recordingJson = localStorage.getItem(`fightRecording_${recordingId}`);
            if (recordingJson) {
                return JSON.parse(recordingJson) as FightRecording;
            }
 return null;
        } catch (error) {
            console.error(`Failed to load recording ${recordingId} from local storage:`, error);
 return null;
        }
    };
    const equippedItemIds = animationState.animations
 .find(anim => anim.id === animationState.currentAnimationId)
 ?.basePose.flatMap(s => s.equippedItems?.map(ei => ei.itemId) || []) || [];
  return (
        <div>
            <h1>HegArt - Symmetric Art Generator</h1>

            <StickmanCanvas
                stickmen={stickmen}
                onStickmanUpdate={handleStickmanUpdate}
 onStickmanPartClick={handleStickmanPartClick} // Pass the new handler
            />

            {/* Layout container for timeline and layer panel */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Timeline Component */}
            <Timeline
                animationState={animationState}
                setAnimationState={setAnimationState}
                currentTime={animationState.currentTime} // Pass currentTime
                 duration={animationState.animations.find(anim => anim.id === animationState.currentAnimationId)?.duration || 0} // Pass duration
                 isPlaying={animationState.isPlaying} // Pass isPlaying
                 isLooping={false} // Placeholder for isLooping
                 setIsLooping={() => {}} // Placeholder for setIsLooping
                 loopStartTime={0} // Placeholder for loopStartTime
                 setLoopStartTime={() => {}} // Placeholder for setLoopStartTime
                 loopEndTime={animationState.animations.find(anim => anim.id === animationState.currentAnimationId)?.duration || 0} // Placeholder for loopEndTime
                 setLoopEndTime={() => {}} // Placeholder for setLoopEndTime
                 loopCount={null} // Placeholder for loopCount
                 setLoopCount={() => {}} // Placeholder for setLoopCount

                // Pass callbacks for Timeline actions to App.tsx
                onAddKeyframe={(time) => {
                    // This logic might change slightly with layers,
                    // adding a keyframe adds it to the current layer
                    // Assuming onAddKeyframe from Timeline passes the current time
                    handleStickmanUpdate(stickmen); // Capture current pose at current time on the current layer
                }}
                onDeleteKeyframe={(time) => {
                    // This needs implementation to delete from the current layer
                     // Implement layer-specific keyframe deletion
                     // This requires knowing which layer to delete from, likely the current layer
                }}
                 // Pass LayerPanel props to Timeline so it can render it (or manage layout separately)
                 layers={currentAnimation?.layers || []} // Pass layers from current animation
                 currentLayerId={animationState.currentLayerId} // Pass current layer ID
                 onSelectLayer={handleSelectLayer} // Pass select layer handler
                 onAddLayer={handleAddLayer} // Pass add layer handler
                 onDeleteLayer={() => {
                     // Call delete handler for the currently selected layer
                      if (animationState.currentLayerId) {
                          handleDeleteLayer(animationState.currentLayerId);
                      }
                 }}
             />

            {/* Layer Panel Component */}
            <LayerPanel
                layers={currentAnimation?.layers || []} // Pass layers from current animation
                currentLayerId={animationState.currentLayerId} // Pass current layer ID
                onSelectLayer={handleSelectLayer} // Pass select layer handler
                onAddLayer={handleAddLayer} // Pass add layer handler
                onDeleteLayer={() => {
                    // Call delete handler for the currently selected layer
                     if (animationState.currentLayerId) {
                         handleDeleteLayer(animationState.currentLayerId);
                     }
                }}
            />

            {/* Game Item Panel */}
            <GameItemPanel
                items={sampleGameItems}
                onEquipItem={handleEquipItem}
                onUnequipItem={handleUnequipItem} // Pass the unequip handler
                equippedItemIds={equippedItemIds} // Pass the list of equipped item IDs
            />
            <GameItemPanel items={sampleGameItems} onEquipItem={handleEquipItem} />

            {/* Shop Panel */}
            <ShopPanel
                itemsForSale={sampleGameItems}
                playerCredits={playerCredits} // Pass player credits to ShopPanel
                onBuyItem={handleBuyItem}
            />

                <span>{animationState.currentTime}ms</span>
            </div>

            {/* Save/Load Controls */}
            <div>
                <input
                    type="text"
                    placeholder="Enter filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                />
                <button onClick={handleSaveStickman}>Save Stickman</button>
                <button onClick={handleLoadStickmen}>Load Stickmen</button>
                {/* Display loaded stickman names */}
                <ul>
                    {animationState.animations.map(anim => (
                        <li key={anim.id}>{anim.name}</li>
                    ))}
                </ul>
            </div>

            {/* Basic Add/Remove Part Controls */}
            {/* Recording Controls */}
            <div>
                <h2>Recording</h2>
                <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
                <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
                {isRecording && <span>Recording...</span>}
                <h3>Saved Recordings</h3>
                <ul>
                    {savedRecordingIds.map(id => (
                        <li key={id}>
                            {id} <button onClick={() => loadRecording(id)}>Load</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <button onClick={handleAddLimb}>Add Limb</button>
                <button onClick={handleAddSegment}>Add Segment</button>
                <button onClick={handleRemovePart}>Remove First Segment of First Limb</button>
            </div>

        </div>
  );
}

export default App;

