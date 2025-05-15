import React, { useRef, useEffect } from 'react';
import { Animation } from '@/types/stickman';

interface TimelineProps {
    animation: Animation | null;
    currentTime: number;
    isPlaying: boolean;
    onScrub: (time: number) => void;
    onPlay: () => void;
    onPause: () => void;
    onStop: () => void;
    onAddKeyframe: (time: number) => void;
    onDeleteKeyframe: (time: number) => void;
    onMoveKeyframe: (oldTime: number, newTime: number) => void;
}
const Timeline: React.FC<TimelineProps> = ({
    animation,
    currentTime,
    isPlaying,
    onScrub,
    onPlay,
    onPause,
    onStop,
    onAddKeyframe,
    onDeleteKeyframe,
    onMoveKeyframe,

}) => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const scrubbing = useRef(false);
    const draggingKeyframe = useRef<number | null>(null);
    const [internalSelectedKeyframeTime, setInternalSelectedKeyframeTime] = React.useState<number | null>(null); // Internal state for selection
    const dragOffset = useRef<number>(0); // Offset from keyframe center to mouse during drag


    // Function to get time from mouse position on the timeline
    const getTimeFromMouseEvent = (event: React.MouseEvent<HTMLDivElement> | MouseEvent): number => {
        if (!timelineRef.current || !animation) return 0;

        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const timelineWidth = rect.width;
        const percentage = Math.max(0, Math.min(1, mouseX / timelineWidth));
        return percentage * animation.duration;
    };


    // Handle mouse down on timeline
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!animation) return;
        event.preventDefault(); // Prevent default drag behavior

        const time = getTimeFromMouseEvent(event);
        const keyframeHitTolerance = 5; // Pixels tolerance

        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Check if a keyframe was clicked
        const clickedKeyframe = animation.keyframes.find(kf => {
            if (!timelineRef.current) return false;
            const rect = timelineRef.current.getBoundingClientRect();
            const timelineWidth = rect.width;
            const keyframeX = (kf.time / animation.duration) * timelineWidth;
            return Math.abs(event.clientX - (rect.left + keyframeX)) < keyframeHitTolerance;
        });

        if (clickedKeyframe) {
            // Start dragging a keyframe
            if (!isPlaying) { // Only allow dragging if not playing
                 draggingKeyframe.current = clickedKeyframe.time;
                 // Calculate offset from keyframe center to mouse
                 const keyframeX = (clickedKeyframe.time / animation.duration) * rect.width;
                 dragOffset.current = event.clientX - (rect.left + keyframeX);

                 document.addEventListener('mousemove', handleKeyframeDrag); // Add a separate handler for drag logic
                 document.addEventListener('mouseup', handleMouseUp);
            }
        } else {
            // Start scrubbing
             setInternalSelectedKeyframeTime(null); // Deselect keyframe when scrubbing
        }
    };

     // Handle mouse move for scrubbing
    const handleMouseMove = (event: MouseEvent) => {
        if (scrubbing.current) {
            event.preventDefault(); // Prevent default drag behavior
            const time = getTimeFromMouseEvent(event);
            onScrub({ target: { value: time.toString() } } as React.ChangeEvent<HTMLInputElement>); // Simulate change event
        }
    };
    // Handle mouse move for dragging a keyframe
    const handleKeyframeDrag = (event: MouseEvent) => {
        if (draggingKeyframe.current !== null && animation) {
            event.preventDefault(); // Prevent default drag behavior
            if (!timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const timelineWidth = rect.width;
             // Calculate mouse position relative to timeline container, considering the drag offset
            const mouseXWithOffset = event.clientX - rect.left - dragOffset.current;
            const percentage = Math.max(0, Math.min(1, mouseXWithOffset / timelineWidth));
            const newTime = percentage * animation.duration;

            // Update the current time during drag to show the pose at the dragged position
            onScrub({ target: { value: newTime.toString() } } as React.ChangeEvent<HTMLInputElement>);
        }
    };
    // Handle mouse up for scrubbing or dragging
    const handleMouseUp = (event: MouseEvent) => {
        event.preventDefault(); // Prevent default drag behavior

        if (scrubbing.current) {
            scrubbing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        } else if (draggingKeyframe.current !== null && animation) {
            const finalMouseUpTime = getTimeFromMouseEvent(event); // Use mouse up position for final time

            // Optional: Add logic to prevent dropping on an existing keyframe here if needed
            // For now, we allow dropping on an existing keyframe, the onMoveKeyframe logic in App.tsx will handle duplicates.

            onMoveKeyframe(draggingKeyframe.current, finalMouseUpTime); // Call the prop function

            draggingKeyframe.current = null;
            dragOffset.current = 0;
            document.removeEventListener('mousemove', handleKeyframeDrag);
        }
    };

    // Handle double click to add/delete keyframe
    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
         if (!animation) return;
         event.preventDefault(); // Prevent default browser behavior
         const time = getTimeFromMouseEvent(event);

         // Check if a keyframe exists at this time (with a small tolerance)
         const keyframeHitTolerance = 10; // Pixels tolerance
         const existingKeyframe = animation.keyframes.find(kf => {
              if (!timelineRef.current) return false;
              const rect = timelineRef.current.getBoundingClientRect();
              const timelineWidth = rect.width;
              const keyframeX = (kf.time / animation.duration) * timelineWidth;
              return Math.abs(event.clientX - (rect.left + keyframeX)) < keyframeHitTolerance;
         });


         if (existingKeyframe) {
             // Double clicked on an existing keyframe - delete it
             onDeleteKeyframe(existingKeyframe.time);
         } else {
             // Double clicked on an empty spot - add a keyframe at the current scrub time
             // Or maybe add a keyframe at the double-click time? Let's use double-click time for now.
              onAddKeyframe(time);
         }
    };

     // Handle click directly on a keyframe marker
     const handleKeyframeClick = (event: React.MouseEvent<HTMLDivElement>, keyframeTime: number) => {
         event.preventDefault(); // Prevent default browser behavior
         event.stopPropagation(); // Prevent the click from bubbling up to the timeline container
         setInternalSelectedKeyframeTime(keyframeTime);
     };

     // Handle deleting the selected keyframe via button
     const handleDeleteSelectedKeyframe = () => {
         if (internalSelectedKeyframeTime !== null) {
             onDeleteKeyframe(internalSelectedKeyframeTime);
             setInternalSelectedKeyframeTime(null); // Deselect after deleting
         } else {
             console.warn("No keyframe selected to delete.");
         }
     };

    // Handle adding a keyframe via button
    const handleAddKeyframeButtonClick = () => {
        onAddKeyframe(currentTime);
    };

    // Clean up mouse event listeners
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleKeyframeDrag);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);


    // Format time for display (e.g., milliseconds to seconds)
    const formatTime = (timeInMs: number): string => {
        const seconds = Math.floor(timeInMs / 1000);
        const milliseconds = Math.round((timeInMs % 1000)); // Round to nearest millisecond
        return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    };


    if (!animation) {
        return <div>No animation selected.</div>;
    }

    // Calculate percentage for keyframe positioning and scrubber
    const currentPercentage = (currentTime / animation.duration) * 100;

    return (
        <div className="timeline-controls-container">
            <h3>Timeline: {animation.name}</h3>
            <div className="playback-controls">
                <button onClick={onPlay} disabled={isPlaying}>Play</button>
                <button onClick={onPause} disabled={!isPlaying}>Pause</button>
                <button onClick={onStop} disabled={currentTime === 0 && !isPlaying && animation.keyframes.length <= 1}>Stop</button> {/* Disable stop if at start and no keyframes */}
                <button onClick={handleDeleteSelectedKeyframe} disabled={internalSelectedKeyframeTime === null}>Delete Selected Keyframe</button>
                {/* Add Looping control here if implemented */}
            </div>

            <div
                ref={timelineRef}
                style={{ // Use CSS class for better styling
                    cursor: scrubbing.current || draggingKeyframe.current !== null ? 'grabbing' : 'pointer',
                }}
                onMouseDown={handleMouseDown}
                        style={{
                            position: 'absolute',
                            left: `${(kf.time / animation.duration) * 100}%`,
                            top: '0',
                            width: '10px',
                            height: '100%',
                            backgroundColor: internalSelectedKeyframeTime === kf.time ? 'yellow' : 'red', // Highlight selected
                            outline: internalSelectedKeyframeTime === kf.time ? '2px solid blue' : 'none', // Outline selected
                            cursor: 'grab',
                            transform: 'translateX(-50%)', // Center the marker
                            zIndex: 1, // Ensure markers are above the track
                            boxSizing: 'border-box', // Include outline in size
                        }}
                        onMouseDown={(e) => handleMouseDown(e, kf.time)}
                         onClick={(e) => handleKeyframeClick(e, kf.time)} // Keep click for selection
                    >
                         {/* You can add a small visual indicator here */}
                    </div>

                ))}

                 {/* Add a hidden range input that syncs with visual scrubber */}
                 <input
                     type="range"
                     min="0"
                     max={animation.duration}
                 />

                {/* Current time indicator (scrubber head) */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${(currentTime / animation.duration) * 100}%`,
                        top: '0',
                        width: '3px', // Slightly wider scrubber
                        height: '100%',
                        backgroundColor: '#007bff', // Blue color
                        zIndex: 2, // Ensure scrubber head is on top
                         pointerEvents: 'none', // Don't interfere with mouse events on the track
                        transform: 'translateX(-50%)', // Center the scrubber head
                        cursor: 'grab', // Indicate it's draggable (though handled by container mousedown)
                    }}
                ></div>
            </div>

            {/* Time display */}
            <div className="time-display">
                Current Time: {formatTime(currentTime)} / Duration: {formatTime(animation.duration)}
            </div>
             <button onClick={handleAddKeyframeButtonClick}>Add Keyframe at Current Time</button>

        </div>
    );
};

export default Timeline;
