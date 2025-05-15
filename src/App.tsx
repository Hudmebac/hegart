
"use client";

import React, { useState, useEffect } from 'react';
// import AnimationManager from './components/AnimationManager'; // Removed AnimationManager as Timeline is replacing its role
import StickmanCanvas from './components/StickmanCanvas'; // Assuming StickmanCanvas is imported here
import { Stickman, AnimationState, Animation, Keyframe, Point, LayerKeyframe } from './types/stickman'; // Added LayerKeyframe
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

const App: React.FC = () => { // Added React.FC type
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
                rotation: 0, // Added missing rotation property
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
            strength: 10, // Added missing properties
            defense: 5,
            speed: 1,
            experience: 0,
            level: 1,
            isAI: false,
            aiState: 'idle',
            targetId: null,
            currentAttackAnimation: null,
            unlockedAbilities: [],
            equippedItems: [], // Added missing equippedItems
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
            scope: { partIds: [], properties: [] }, // Initialize scope correctly
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
    const interpolateStickmenPose = (animation: Animation, time: number): Stickman[] => { // Renamed to avoid conflict
        // Start with the base pose
        let interpolatedPose = JSON.parse(JSON.stringify(animation.basePose)); // Deep copy base pose

        // Apply layers in order (assuming layers array is ordered bottom-up)
        animation.layers.forEach(layer => {
            if (!layer.isVisible) return;

            // Find keyframes bracketing the current time for this layer
            const beforeKeyframeIndex = layer.keyframes.reduce((prevIndex, currentKeyframe, index) => {
                return currentKeyframe.time <= time ? index : prevIndex;
            }, -1); // Initialize to -1 if no keyframe is before current time

            const beforeKeyframe = beforeKeyframeIndex !== -1 ? layer.keyframes[beforeKeyframeIndex] : null;
            const afterKeyframe = beforeKeyframeIndex !== -1 && (beforeKeyframeIndex + 1 < layer.keyframes.length) ? layer.keyframes[beforeKeyframeIndex + 1] : null;


            let layerAppliedPose: Stickman[];

            if (!beforeKeyframe) {
                 // No keyframes in this layer yet or time is before first keyframe
                 // The pose remains unchanged by this layer
                 layerAppliedPose = interpolatedPose;
            } else if (!afterKeyframe || beforeKeyframe === afterKeyframe) {
                // Only one keyframe or time is at or after the last keyframe
                // Apply the state from the single keyframe or the last keyframe
                layerAppliedPose = applyLayerKeyframeToPose(interpolatedPose, beforeKeyframe);

            } else {
                 // Interpolate between before and after keyframes
                const timeRange = afterKeyframe.time - beforeKeyframe.time;
                const t = timeRange === 0 ? 0 : (time - beforeKeyframe.time) / timeRange;


                // Interpolate the state between the two layer keyframes
                const interpolatedLayerState = interpolateLayerStates(beforeKeyframe, afterKeyframe, t, layer.scope.partIds); // Pass partIds for scope

                // Apply the interpolated state to the current pose
                // Ensure interpolatedLayerState is compatible with LayerKeyframe structure expected by applyLayerKeyframeToPose
                layerAppliedPose = applyLayerKeyframeToPose(interpolatedPose, { time, ...interpolatedLayerState } as LayerKeyframe);
            }

             if (layer.blendMode === 'override') {
                 if (layer.scope.partIds && layer.scope.partIds.length > 0) {
                     interpolatedPose = interpolatedPose.map(stickman => {
                          const updatedStickman = { ...stickman };
                          const layerStickman = layerAppliedPose.find(ls => ls.id === stickman.id);

                          if (layerStickman) {
                               if (layer.scope.partIds.includes(stickman.body.id) && layerStickman.body) updatedStickman.body = layerStickman.body;
                               if (layer.scope.partIds.includes(stickman.head.id) && layerStickman.head) updatedStickman.head = layerStickman.head;

                                updatedStickman.limbs = updatedStickman.limbs.map(limb => {
                                    const layerLimb = layerStickman.limbs.find(ll => ll.id === limb.id);
                                     if (layer.scope.partIds.includes(limb.id) && layerLimb) return layerLimb;

                                     limb.segments = limb.segments.map(segment => {
                                         const layerSegment = layerLimb?.segments.find(ls => ls.id === segment.id);
                                         if (layer.scope.partIds.includes(segment.id) && layerSegment) return layerSegment;
                                         return segment;
                                     });
                                     return limb;
                                });
                          }
                         return updatedStickman;
                     });
                 } else {
                     interpolatedPose = layerAppliedPose;
                 }
             }

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
     const applyLayerKeyframeToPose = (pose: Stickman[], layerKeyframe: LayerKeyframe): Stickman[] => {
        return pose.map(stickman => {
            const updatedStickman = { ...stickman }; // Deep clone individual stickman
            const keyframeStickmanData = (layerKeyframe as any)[stickman.id]; // Access by stickman ID

            if (keyframeStickmanData) {
                if (keyframeStickmanData.body) updatedStickman.body = { ...updatedStickman.body, ...keyframeStickmanData.body };
                if (keyframeStickmanData.head) updatedStickman.head = { ...updatedStickman.head, ...keyframeStickmanData.head };
                if (keyframeStickmanData.limbs) {
                    updatedStickman.limbs = updatedStickman.limbs.map(limb => {
                        const keyframeLimbData = keyframeStickmanData.limbs[limb.id];
                        if (keyframeLimbData) {
                            const updatedLimb = { ...limb };
                            if (keyframeLimbData.segments) {
                                updatedLimb.segments = updatedLimb.segments.map(segment => {
                                    const keyframeSegmentData = keyframeLimbData.segments[segment.id];
                                    if (keyframeSegmentData) {
                                        return { ...segment, ...keyframeSegmentData };
                                    }
                                    return segment;
                                });
                            }
                            // Apply other limb properties if any
                            if (keyframeLimbData.position) updatedLimb.connectionPoint = keyframeLimbData.position; // Example for limb position
                            if (keyframeLimbData.rotation) { /* apply limb rotation if limbs have independent rotation */ }
                            return updatedLimb;
                        }
                        return limb;
                    });
                }
            }
            return updatedStickman;
        });
    };


    // Helper function to interpolate between two LayerKeyframe states
    const interpolateLayerStates = (kf1: LayerKeyframe, kf2: LayerKeyframe, t: number, scopedPartIds: string[]): any => {
        const interpolatedState: any = { time: kf1.time + (kf2.time - kf1.time) * t };

        // Iterate over all stickman IDs present in either keyframe
        const stickmanIds = new Set([...Object.keys(kf1), ...Object.keys(kf2)].filter(key => key !== 'time'));


        stickmanIds.forEach(stickmanId => {
            const data1 = (kf1 as any)[stickmanId];
            const data2 = (kf2 as any)[stickmanId];
            interpolatedState[stickmanId] = {};

            // Interpolate body
            if (scopedPartIds.includes(`${stickmanId}.body`) || scopedPartIds.includes(data1?.body?.id) || scopedPartIds.includes(data2?.body?.id)) {
                 if (data1?.body && data2?.body) {
                    interpolatedState[stickmanId].body = {
                        position: {
                            x: data1.body.position.x + (data2.body.position.x - data1.body.position.x) * t,
                            y: data1.body.position.y + (data2.body.position.y - data1.body.position.y) * t,
                        },
                        rotation: data1.body.rotation + (data2.body.rotation - data1.body.rotation) * t,
                    };
                 } else if (data1?.body) {
                    interpolatedState[stickmanId].body = data1.body;
                 } else if (data2?.body) {
                    interpolatedState[stickmanId].body = data2.body;
                 }
            }

            // Interpolate head
            if (scopedPartIds.includes(`${stickmanId}.head`) || scopedPartIds.includes(data1?.head?.id) || scopedPartIds.includes(data2?.head?.id)) {
                 if (data1?.head && data2?.head) {
                    interpolatedState[stickmanId].head = {
                        position: {
                            x: data1.head.position.x + (data2.head.position.x - data1.head.position.x) * t,
                            y: data1.head.position.y + (data2.head.position.y - data1.head.position.y) * t,
                        },
                        rotation: data1.head.rotation + (data2.head.rotation - data1.head.rotation) * t,
                    };
                 } else if (data1?.head) {
                    interpolatedState[stickmanId].head = data1.head;
                 } else if (data2?.head) {
                    interpolatedState[stickmanId].head = data2.head;
                 }
            }


            // Interpolate limbs and segments
            if (data1?.limbs || data2?.limbs) {
                interpolatedState[stickmanId].limbs = {};
                const limbIds = new Set([
                    ...(data1?.limbs ? Object.keys(data1.limbs) : []),
                    ...(data2?.limbs ? Object.keys(data2.limbs) : [])
                ]);

                limbIds.forEach(limbId => {
                    if (!scopedPartIds.some(id => id.startsWith(`${stickmanId}.limbs.${limbId}`))) return;

                    const limb1 = data1?.limbs?.[limbId];
                    const limb2 = data2?.limbs?.[limbId];
                    interpolatedState[stickmanId].limbs[limbId] = { segments: {} };

                    if (limb1?.segments || limb2?.segments) {
                        const segmentIds = new Set([
                            ...(limb1?.segments ? Object.keys(limb1.segments) : []),
                            ...(limb2?.segments ? Object.keys(limb2.segments) : [])
                        ]);

                        segmentIds.forEach(segmentId => {
                             if (!scopedPartIds.includes(`${stickmanId}.limbs.${limbId}.segments.${segmentId}`)) return;

                            const seg1 = limb1?.segments?.[segmentId];
                            const seg2 = limb2?.segments?.[segmentId];

                            if (seg1 && seg2) {
                                interpolatedState[stickmanId].limbs[limbId].segments[segmentId] = {
                                    position: { // Assuming segments can have position, though typically (0,0)
                                        x: (seg1.position?.x || 0) + ((seg2.position?.x || 0) - (seg1.position?.x || 0)) * t,
                                        y: (seg1.position?.y || 0) + ((seg2.position?.y || 0) - (seg1.position?.y || 0)) * t,
                                    },
                                    rotation: seg1.rotation + (seg2.rotation - seg1.rotation) * t,
                                };
                            } else if (seg1) {
                                interpolatedState[stickmanId].limbs[limbId].segments[segmentId] = seg1;
                            } else if (seg2) {
                                interpolatedState[stickmanId].limbs[limbId].segments[segmentId] = seg2;
                            }
                        });
                    }
                });
            }
        });
        return interpolatedState;
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
 console.log(`AI Stickman ${stickman.id} is close enough to attack ${target.id}.`);
                                }
                            }
                            break;
                        case 'defending':
                            break;
                        default:
                            break;
                    }
                }
                return stickman; 
            });


            const interpolatedStickmen = interpolateStickmenPose({ ...currentAnimation, basePose: updatedStickmenForAI }, animationState.currentTime);
            setStickmen(interpolatedStickmen);
        } else {
             setStickmen(animationState.animations[0]?.basePose || []);
        }
    }, [animationState.currentTime, animationState.currentAnimationId, animationState.animations]);


    // Handle drag updates
    const handleStickmanUpdate = (updatedStickmen: Stickman[]) => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation || prevState.currentLayerId === null) return prevState; 

            const currentLayer = currentAnimation.layers.find(layer => layer.id === prevState.currentLayerId);
            if (!currentLayer || currentLayer.isLocked) return prevState; 

            const currentTime = prevState.currentTime;
            const existingKeyframeIndex = currentLayer.keyframes.findIndex(kf => kf.time === currentTime);

            // Create a LayerKeyframe storing the state of the modified parts
            const newLayerKeyframeData: any = { time: currentTime };
            updatedStickmen.forEach(stickman => {
                newLayerKeyframeData[stickman.id] = {
                    body: { position: stickman.body.position, rotation: stickman.body.rotation },
                    head: { position: stickman.head.position, rotation: stickman.head.rotation },
                    limbs: stickman.limbs.reduce((acc, limb) => {
                        acc[limb.id] = {
                            segments: limb.segments.reduce((segAcc, segment) => {
                                segAcc[segment.id] = { position: segment.position, rotation: segment.rotation };
                                return segAcc;
                            }, {} as any)
                        };
                        return acc;
                    }, {} as any)
                };
            });
            const newLayerKeyframe: LayerKeyframe = newLayerKeyframeData as LayerKeyframe;


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

            const updatedLayer = {
                ...currentLayer,
                keyframes: updatedKeyframes,
            };

            const updatedAnimation = {
                ...currentAnimation,
                layers: currentAnimation.layers.map(layer =>
                    layer.id === updatedLayer.id ? updatedLayer : layer
                ),
            };

            const updatedAnimations = prevState.animations.map(anim =>
                anim.id === updatedAnimation.id ? updatedAnimation : anim
            );

            return {
                ...prevState,
                animations: updatedAnimations,
            };
        });
    };

    // Handle Layer Panel actions
    const handleSelectLayer = (layerId: string) => {
        setAnimationState(prevState => ({
            ...prevState,
            currentLayerId: layerId,
         }));
    };

    // Game loop / Update logic
    useEffect(() => {
        let frameId: number;
        if (animationState.isPlaying) {
            const loop = (timestamp: number) => {
                if (!animationState.isPlaying) return; // Ensure stop if isPlaying becomes false

                setAnimationState(prev => {
                    const currentAnim = prev.animations.find(anim => anim.id === prev.currentAnimationId);
                    if (!currentAnim) return prev;

                    let newTime = prev.currentTime + (timestamp - (lastFrameTimestamp.current || timestamp));
                    lastFrameTimestamp.current = timestamp;


                    if (newTime >= currentAnim.duration) {
                        newTime = 0; // Loop animation
                    }
                    return { ...prev, currentTime: newTime };
                });
                frameId = requestAnimationFrame(loop);
            };
            const lastFrameTimestamp = React.useRef<number | null>(null);
            frameId = requestAnimationFrame(loop);
        }
        return () => {
            if (frameId) cancelAnimationFrame(frameId);
            lastFrameTimestamp.current = null; // Reset on pause/stop
        };
    }, [animationState.isPlaying, animationState.currentAnimationId, animationState.animations]);


    useEffect(() => {
        if (animationState.isPlaying && isRecording && recordingStartTime !== null) {
            const currentTime = Date.now();
            const elapsed = currentTime - recordingStartTime;

            const recordedStickmenState = stickmen.map(s => ({
                id: s.id,
                // pose: s.body.position, // Simplified: just record body position - Needs to be full pose
                pose: { // Placeholder for full pose recording
                    body: { position: s.body.position, rotation: s.body.rotation },
                    head: { position: s.head.position, rotation: s.head.rotation },
                    limbs: s.limbs.map(l => ({
                        ...l,
                        segments: l.segments.map(sg => ({ position: sg.position, rotation: sg.rotation }))
                    }))
                },
                health: s.health, 
            }));

            const newFrame: RecordedFrame = {
                 time: elapsed,
                 stickmen: recordedStickmenState as any, // Cast to any for now, ensure pose structure matches later
            };
            setCurrentRecordingFrames(prevFrames => [...prevFrames, newFrame]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animationState.currentTime, isRecording, stickmen]); // Re-record frame when currentTime (and thus stickmen) changes


    const handleAddLayer = () => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation) return prevState;

            const newLayerId = `layer-${Date.now()}`; 
            const newLayer = {
                id: newLayerId,
                name: `Layer ${currentAnimation.layers.length + 1}`,
                blendMode: 'override' as const, 
                opacity: 1.0,
                isVisible: true,
                isLocked: false,
                scope: { partIds: [], properties: [] }, // Initialize scope correctly
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
                currentLayerId: newLayerId, 
            };
        });
    };

    const handleDeleteLayer = (layerId: string) => {
        setAnimationState(prevState => {
            const currentAnimation = prevState.animations.find(anim => anim.id === prevState.currentAnimationId);
            if (!currentAnimation || currentAnimation.layers.length <= 1) return prevState; 

            const updatedLayers = currentAnimation.layers.filter(layer => layer.id !== layerId);
            const updatedAnimation = {
                ...currentAnimation,
                layers: updatedLayers,
            };
            const updatedAnimations = prevState.animations.map(anim =>
                anim.id === updatedAnimation.id ? updatedAnimation : anim
            );
            const newCurrentLayerId = prevState.currentLayerId === layerId ? updatedLayers[0]?.id || null : prevState.currentLayerId; 
            return { ...prevState, animations: updatedAnimations, currentLayerId: newCurrentLayerId };
        });
    };
    const handleTimelineScrub = (time: number) => {
         setAnimationState(prevState => ({
             ...prevState,
             currentTime: time,
         }));
    };


    const handleAddLimb = () => {
        console.log("Add Limb clicked (placeholder)");
    };

     const handleAddSegment = () => {
        console.log("Add Segment clicked (placeholder)");
    };

     const handleRemovePart = () => {
        console.log("Remove Part clicked (placeholder)");
    };

    const handleSaveStickmanAnimation = () => { // Renamed to avoid conflict with storage import
        if (!filename || !animationState.currentAnimationId) {
            console.warn("Please enter a filename and ensure an animation is selected.");
            return;
        }
         const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);
         if (currentAnimation) {
             // saveStickman(filename, currentAnimation); // This function is not correctly imported/defined from storage
             console.log(`Animation '${currentAnimation.name}' saved as ${filename} (Save logic needs to be fixed)`);
             // For now, let's stringify and save the animation itself under a key like `animation_${filename}`
             try {
                localStorage.setItem(`animation_${filename}`, JSON.stringify(currentAnimation));
                console.log(`Animation '${currentAnimation.name}' saved as animation_${filename} to localStorage.`);
             } catch (e) {
                console.error("Error saving animation to localStorage", e);
             }
         }
    };

    const handleLoadStickmanAnimation = async () => { // Renamed and made async to match original structure
        if (!filename) {
             console.warn("Please enter a filename to load.");
             return;
        }
        try {
            // const loadedAnimation: Animation | null = await loadStickmen(filename) as Animation | null; // loadStickmen from storage returns Stickman[]
            // For now, let's try to load the animation directly using the key `animation_${filename}`
            const animationJson = localStorage.getItem(`animation_${filename}`);
            if (!animationJson) {
                console.warn(`No animation found in localStorage with key: animation_${filename}`);
                return;
            }
            const loadedAnimation: Animation | null = JSON.parse(animationJson) as Animation | null;

            if (loadedAnimation) {
                 setAnimationState(prevState => {
                     const existingIndex = prevState.animations.findIndex(anim => anim.id === loadedAnimation.id);
                     let updatedAnimations;
                     if (existingIndex !== -1) {
                         updatedAnimations = [
                             ...prevState.animations.slice(0, existingIndex),
                             loadedAnimation,
                             ...prevState.animations.slice(existingIndex + 1),
                         ];
                     } else {
                        updatedAnimations = [...prevState.animations, loadedAnimation];
                     }
                     const firstLayerId = loadedAnimation.layers.length > 0 ? loadedAnimation.layers[0].id : null;
                     return {
                         ...prevState,
                         animations: updatedAnimations,
                         currentAnimationId: loadedAnimation.id,
                         currentLayerId: firstLayerId, 
                         currentTime: 0, 
                     };
                 });
                 console.log(`Animation '${loadedAnimation.name}' loaded from animation_${filename}.`);
            } else {
                 console.warn(`Could not parse animation from localStorage key: animation_${filename}`);
            }
        } catch (error) {
             console.error("Failed to load animation:", error);
        }
    };


 const handleEquipItem = (itemId: string) => {
 setSelectedItemIdForEquipping(itemId);
 const item = sampleGameItems.find(i => i.id === itemId);
 console.log(`Selected item to equip: ${item?.name}. Click on a stickman part in the canvas to attach it.`);
    };

 const handleStickmanPartClick = (stickmanId: string, partId: string, isDamagingCollision = false, attackingItemId: string | null = null) => {
 if (selectedItemIdForEquipping === null) {
 setSelectedStickmanId(stickmanId);
 console.log(`Stickman ${stickmanId}, Part ${partId} clicked.`);

 if (isDamagingCollision && attackingItemId !== null) {
            const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);
            const attackingStickman = currentAnimation?.basePose.find(s => s.equippedItems?.some(ei => ei.itemId === attackingItemId));
            const targetStickman = currentAnimation?.basePose.find(s => s.id === stickmanId);
            
            const attackingItem = sampleGameItems.find(item => item.id === attackingItemId && item.type === 'weapon') as Weapon | undefined;

 if (targetStickman && attackingStickman && attackingItem) {
 const damageDealt = calculateDamage(attackingStickman, targetStickman, attackingItem.damage); 
 console.log(`Collision detected! Stickman ${stickmanId} hit in part ${partId} by ${attackingItem.name}. Damage dealt: ${damageDealt}`);
 if (targetStickman.health > 0 && targetStickman.health - damageDealt <= 0 && targetStickman.isAI) {
 console.log(`AI Stickman ${stickmanId} defeated! Awarding ${CREDITS_PER_DEFEAT} credits.`);
 setPlayerCredits(prevCredits => prevCredits + CREDITS_PER_DEFEAT);
 }

 setAnimationState(prevState => {
                    const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(s => {
 if (s.id === stickmanId) {
 const newHealth = Math.max(0, s.health - damageDealt); 
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
 return; 
        }

 setAnimationState(prevState => {
 const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(stickman => {
 if (stickman.id === stickmanId) {
 const newItem: EquippedItem = { itemId: selectedItemIdForEquipping!, attachedToPartId: partId }; // Add type assertion
 return { ...stickman, equippedItems: [...(stickman.equippedItems || []), newItem] };
                            }
 return stickman;
                        });
 return { ...anim, basePose: updatedBasePose }; 
                    }
 return anim;
                });
            return { ...prevState, animations: updatedAnimations };
        });
 setSelectedItemIdForEquipping(null); 
 console.log(`Equipped item ${selectedItemIdForEquipping} to part ${partId} on stickman ${stickmanId}.`);
    };

    const handleBuyItem = (itemId: string) => {
        const itemToBuy = sampleGameItems.find(item => item.id === itemId);

 if (!itemToBuy) {
            console.warn(`Item with ID ${itemId} not found.`);
 return;
        }

 if (playerCredits >= itemToBuy.cost) {
 setPlayerCredits(prevCredits => prevCredits - itemToBuy.cost);
 setPlayerInventory(prevInventory => [...prevInventory, itemToBuy]);
 console.log(`Successfully bought ${itemToBuy.name} for ${itemToBuy.cost} credits.`);
 console.log(`Current credits: ${playerCredits - itemToBuy.cost}`); 
 console.log('Inventory:', [...playerInventory, itemToBuy]); 
        } else {
            console.warn(`Insufficient credits to buy ${itemToBuy.name}. Need ${itemToBuy.cost}, have ${playerCredits}.`);
        }
    };

    const handleUnequipItem = (itemId: string) => {
 setAnimationState(prevState => {
 const updatedAnimations = prevState.animations.map(anim => {
 if (anim.id === prevState.currentAnimationId) {
 const updatedBasePose = anim.basePose.map(stickman => {
 if (stickman.equippedItems) {
 const updatedEquippedItems = stickman.equippedItems.filter(
 (equippedItem: EquippedItem) => equippedItem.itemId !== itemId
 );
 if (updatedEquippedItems.length < stickman.equippedItems.length) {
 console.log(`Unequipped item ${itemId} from stickman ${stickman.id}.`);
                                             return {
 ...stickman,
 equippedItems: updatedEquippedItems,
                                             };
                                         }
 }
 return stickman; 
                            });
 return { ...anim, basePose: updatedBasePose }; 
                        }
 return anim; 
                    });
 return { ...prevState, animations: updatedAnimations };
                });
    };

    const startRecording = () => {
 setIsRecording(true);
 setRecordingStartTime(Date.now());
 setCurrentRecordingFrames([]); 
 console.log("Recording started.");
    };

    const stopRecording = () => {
 setIsRecording(false);
 const duration = recordingStartTime ? Date.now() - recordingStartTime : 0;

 const recordingId = `recording-${Date.now()}`; 
 const fightRecording: FightRecording = {
 id: recordingId,
 timestamp: Date.now(),
 duration: duration,
 frames: currentRecordingFrames,
        };
 console.log(`Recording stopped. Duration: ${duration}ms. Captured ${currentRecordingFrames.length} frames.`);
        console.log("Recorded Frames:", currentRecordingFrames); 
 setRecordingStartTime(null);
    
    try {
        const recordingJson = JSON.stringify(fightRecording);
        localStorage.setItem(`fightRecording_${recordingId}`, recordingJson);
        setSavedRecordingIds(prevIds => [...prevIds, recordingId]); 
        console.log(`Recording ${recordingId} saved to local storage.`);
    } catch (error) {
        console.error("Failed to save recording to local storage:", error);
    }
    };

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
    const currentAnimation = animationState.animations.find(anim => anim.id === animationState.currentAnimationId);
    const equippedItemIds = currentAnimation?.basePose.flatMap(s => s.equippedItems?.map(ei => ei.itemId) || []) || [];

  return (
        <div>
            <h1>Stickman Animation Editor</h1>

            <StickmanCanvas
                stickmen={stickmen}
                // onStickmanUpdate={handleStickmanUpdate} // This prop might not exist on this StickmanCanvas version
                // onStickmanPartClick={handleStickmanPartClick}
                width={800} // Example width
                height={600} // Example height
                currentTime={animationState.currentTime}
                duration={currentAnimation?.duration || 0}
                availableItems={sampleGameItems}
                onStickmanPartClick={(stickmanId, partId) => handleStickmanPartClick(stickmanId, partId, false, null)} // Pass a basic handler
            />

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Timeline
                 animation={currentAnimation || null} // Pass the current animation object
                 currentTime={animationState.currentTime}
                 isPlaying={animationState.isPlaying}
                 onScrub={handleTimelineScrub}
                 onPlay={() => setAnimationState(prev => ({ ...prev, isPlaying: true }))}
                 onPause={() => setAnimationState(prev => ({ ...prev, isPlaying: false }))}
                 onStop={() => setAnimationState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))}
                 onAddKeyframe={(time) => {
                     // Logic to add keyframe to current layer at 'time'
                     // For simplicity, call handleStickmanUpdate which adds/updates keyframe at current time
                     handleStickmanUpdate(stickmen);
                 }}
                 onDeleteKeyframe={(time) => {
                     // Logic to delete keyframe from current layer at 'time'
                     setAnimationState(prevState => {
                         const currentAnim = prevState.animations.find(a => a.id === prevState.currentAnimationId);
                         const currentLay = currentAnim?.layers.find(l => l.id === prevState.currentLayerId);
                         if (!currentAnim || !currentLay) return prevState;

                         const updatedKeyframes = currentLay.keyframes.filter(kf => kf.time !== time);
                         const updatedLayer = { ...currentLay, keyframes: updatedKeyframes };
                         const updatedLayers = currentAnim.layers.map(l => l.id === updatedLayer.id ? updatedLayer : l);
                         const updatedAnimation = { ...currentAnim, layers: updatedLayers };
                         const updatedAnimations = prevState.animations.map(a => a.id === updatedAnimation.id ? updatedAnimation : a);
                         return { ...prevState, animations: updatedAnimations };
                     });
                 }}
                 onMoveKeyframe={(oldTime, newTime) => {
                     // Logic to move keyframe from oldTime to newTime on current layer
                     setAnimationState(prevState => {
                        const currentAnim = prevState.animations.find(a => a.id === prevState.currentAnimationId);
                        const currentLay = currentAnim?.layers.find(l => l.id === prevState.currentLayerId);
                        if (!currentAnim || !currentLay) return prevState;

                        const keyframeToMove = currentLay.keyframes.find(kf => kf.time === oldTime);
                        if (!keyframeToMove) return prevState;

                        const otherKeyframes = currentLay.keyframes.filter(kf => kf.time !== oldTime);
                        const movedKeyframe = { ...keyframeToMove, time: newTime };
                        const updatedKeyframes = [...otherKeyframes, movedKeyframe].sort((a,b) => a.time - b.time);

                        const updatedLayer = { ...currentLay, keyframes: updatedKeyframes };
                        const updatedLayers = currentAnim.layers.map(l => l.id === updatedLayer.id ? updatedLayer : l);
                        const updatedAnimation = { ...currentAnim, layers: updatedLayers };
                        const updatedAnimations = prevState.animations.map(a => a.id === updatedAnimation.id ? updatedAnimation : a);
                        return { ...prevState, animations: updatedAnimations };
                     });
                 }}
             />

            <LayerPanel
                layers={currentAnimation?.layers || []} 
                currentLayerId={animationState.currentLayerId} 
                onSelectLayer={handleSelectLayer} 
                onAddLayer={handleAddLayer} 
                onDeleteLayer={(layerId) => handleDeleteLayer(layerId)} // Pass layerId directly
                onChangeLayerBlendMode={(layerId, blendMode) => { // Added this prop
                    setAnimationState(prevState => {
                        const animIndex = prevState.animations.findIndex(a => a.id === prevState.currentAnimationId);
                        if (animIndex === -1) return prevState;
                        const layerIndex = prevState.animations[animIndex].layers.findIndex(l => l.id === layerId);
                        if (layerIndex === -1) return prevState;

                        const newAnimations = [...prevState.animations];
                        newAnimations[animIndex] = {
                            ...newAnimations[animIndex],
                            layers: newAnimations[animIndex].layers.map((l, idx) => 
                                idx === layerIndex ? { ...l, blendMode } : l
                            )
                        };
                        return { ...prevState, animations: newAnimations };
                    });
                }}
            />

            <GameItemPanel
                items={sampleGameItems}
                onEquipItem={handleEquipItem}
                // onUnequipItem={handleUnequipItem} // Prop might be missing on this GameItemPanel version
                // equippedItemIds={equippedItemIds} 
            />
            
            <ShopPanel
                itemsForSale={sampleGameItems}
                playerCredits={playerCredits} 
                onBuyItem={handleBuyItem}
            />

                <span>{animationState.currentTime}ms</span>
            </div>

            <div>
                <input
                    type="text"
                    placeholder="Enter filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                />
                <button onClick={handleSaveStickmanAnimation}>Save Animation</button>
                <button onClick={handleLoadStickmanAnimation}>Load Animation</button>
                <ul>
                    {animationState.animations.map(anim => (
                        <li key={anim.id}>{anim.name}</li>
                    ))}
                </ul>
            </div>

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
                <button onClick={handleRemovePart}>Remove Part</button>
            </div>

        </div>
  );
}

export default App;
