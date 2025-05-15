import React, { useState, useEffect } from 'react';
import StickmanCanvas from './canvas/StickmanCanvas';
import { Stickman, Point, Limb, Segment } from '@/types/stickman';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs

// Example default segment data for adding new parts
const defaultNewSegment: Omit<Segment, 'id'> = {
    name: 'New Segment',
    length: 30,
    thickness: 5,
    rotation: 0,
    position: { x: 0, y: 0 },
};

// Example default limb data for adding new limbs
const defaultNewLimb: Omit<Limb, 'id'> = {
    type: 'arm', // Default type, could be parameterized
    name: 'New Limb',
    connectionPoint: { x: 0, y: 0 }, // Default connection point, should be settable
    segments: [
        {
            id: uuidv4(), // Generate ID for the first segment
            ...defaultNewSegment
        }
    ]
};


const AnimationManager: React.FC = () => {
    const [stickmen, setStickmen] = useState<Stickman[]>([]);

    // Load an initial stickman on component mount
    useEffect(() => {
        const initialStickman: Stickman = {
            id: uuidv4(),
            name: 'Default Stickman',
            body: {
                id: uuidv4(),
                name: 'Body',
                position: { x: 400, y: 300 },
                rotation: 0,
                width: 40,
                height: 80,
                thickness: 10,
                strokeStyle: 'black',
                lineWidth: 10,
                connectionPoints: {
                    head: { x: 0, y: -40 },
                    'right-arm': { x: 20, y: -30 },
                    'left-arm': { x: -20, y: -30 },
                    'right-leg': { x: 10, y: 40 },
                    'left-leg': { x: -10, y: 40 },
                },
                // minPosition: { x: 0, y: 0 },
                // maxPosition: { x: 800, y: 600 },
                // minRotation: -Math.PI / 4,
                // maxRotation: Math.PI / 4,
            },
            head: {
                id: uuidv4(),
                name: 'Head',
                position: { x: 0, y: -20 },
                radius: 15,
                thickness: 8,
                strokeStyle: 'black',
                lineWidth: 8,
                // minRotation: -Math.PI / 2,
                // maxRotation: Math.PI / 2,
            },
            limbs: [
                {
                    id: uuidv4(),
                    type: 'arm',
                    name: 'Right Arm',
                    connectionPoint: { x: 20, y: -30 },
                    segments: [
                        {
                            id: uuidv4(),
                            name: 'Upper Arm',
                            length: 30,
                            thickness: 5,
                            rotation: Math.PI / 4,
                            position: { x: 0, y: 0 },
                        },
                        {
                            id: uuidv4(),
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
                {
                    id: uuidv4(),
                    type: 'arm',
                    name: 'Left Arm',
                    connectionPoint: { x: -20, y: -30 },
                    segments: [
                         {
                            id: uuidv4(),
                            name: 'Upper Arm',
                            length: 30,
                            thickness: 5,
                            rotation: 3 * Math.PI / 4,
                            position: { x: 0, y: 0 },
                        },
                        {
                            id: uuidv4(),
                            name: 'Forearm',
                            length: 30,
                            thickness: 5,
                            rotation: -Math.PI / 4,
                            position: { x: 0, y: 0 },
                             minRotation: -Math.PI * 0.1,
                            maxRotation: Math.PI * 0.8,
                        },
                    ],
                },
            ],
        };
        setStickmen([initialStickman]);
    }, []);

    // Handler to update a stickman's state
    const handleStickmanUpdate = (updatedStickman: Stickman) => {
        setStickmen(prevStickmen =>
            prevStickmen.map(stickman =>
                stickman.id === updatedStickman.id ? updatedStickman : stickman
            )
        );
    };

    // Function to add a new limb to a stickman
    const addLimb = (stickmanId: string, newLimbData?: Partial<Omit<Limb, 'id'>>) => {
        setStickmen(prevStickmen =>
            prevStickmen.map(stickman => {
                if (stickman.id === stickmanId) {
                    const newLimb: Limb = {
                        id: uuidv4(), // Generate unique ID for the new limb
                        ...defaultNewLimb, // Start with default data
                        ...newLimbData, // Override with provided data
                        segments: newLimbData?.segments ?
                            newLimbData.segments.map(seg => ({ id: uuidv4(), ...seg })) :
                            [{ id: uuidv4(), ...defaultNewSegment }] // Ensure segments have IDs
                    };
                    return {
                        ...stickman,
                        limbs: [...stickman.limbs, newLimb],
                    };
                }
                return stickman;
            })
        );
    };

    // Function to add a new segment to an existing limb
    const addSegment = (stickmanId: string, limbId: string, newSegmentData?: Partial<Omit<Segment, 'id'>>) => {
        setStickmen(prevStickmen =>
            prevStickmen.map(stickman => {
                if (stickman.id === stickmanId) {
                    return {
                        ...stickman,
                        limbs: stickman.limbs.map(limb => {
                            if (limb.id === limbId) {
                                const newSegment: Segment = {
                                    id: uuidv4(), // Generate unique ID for the new segment
                                    ...defaultNewSegment, // Start with default data
                                    ...newSegmentData, // Override with provided data
                                };
                                return {
                                    ...limb,
                                    segments: [...limb.segments, newSegment],
                                };
                            }
                            return limb;
                        }),
                    };
                }
                return stickman;
            })
        );
    };

    // Function to remove a part (limb or segment) from a stickman
    const removePart = (stickmanId: string, partId: string, partType: 'limb' | 'segment') => {
        setStickmen(prevStickmen =>
            prevStickmen.map(stickman => {
                if (stickman.id === stickmanId) {
                    if (partType === 'limb') {
                        return {
                            ...stickman,
                            limbs: stickman.limbs.filter(limb => limb.id !== partId),
                        };
                    } else if (partType === 'segment') {
                        return {
                            ...stickman,
                            limbs: stickman.limbs.map(limb => ({
                                ...limb,
                                segments: limb.segments.filter(segment => segment.id !== partId),
                            })).filter(limb => limb.segments.length > 0), // Optionally remove limb if it has no segments left
                        };
                    }
                }
                return stickman;
            })
        );
    };


    return (
        <div>
            {/* Render buttons or UI elements to call addLimb, addSegment, removePart */}
             <p>Add UI controls here to call the functions (e.g., buttons).</p>
             {stickmen.map(stickman => (
                 <div key={stickman.id}>
                     <h2>{stickman.name}</h2>
                     {/* Example buttons - you'd want more specific UI in a real app */}
                     <button onClick={() => addLimb(stickman.id)}>Add New Limb</button>
                     {stickman.limbs.map(limb => (
                         <span key={limb.id}>
                             Limb: {limb.name}
                             <button onClick={() => addSegment(stickman.id, limb.id)}>Add Segment to {limb.name}</button>
                             <button onClick={() => removePart(stickman.id, limb.id, 'limb')}>Remove {limb.name}</button>
                              {limb.segments.map(segment => (
                                  <span key={segment.id}>
                                       Segment: {segment.name}
                                      <button onClick={() => removePart(stickman.id, segment.id, 'segment')}>Remove {segment.name}</button>
                                  </span>
                              ))}
                         </span>
                     ))}
                 </div>
             ))}

            <StickmanCanvas stickmen={stickmen} onStickmanUpdate={handleStickmanUpdate} />
        </div>
    );
};

export default AnimationManager;