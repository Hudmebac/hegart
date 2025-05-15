
"use client";

import React, { useRef, useEffect, useState } from 'react'; // Added useState
import { Animation, Keyframe } from '@/types/stickman'; // Ensure Keyframe is imported if used explicitly

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
    const [internalSelectedKeyframeTime, setInternalSelectedKeyframeTime] = useState<number | null>(null);
    const dragOffset = useRef<number>(0); 


    const getTimeFromMouseEvent = (event: React.MouseEvent<HTMLDivElement> | MouseEvent): number => {
        if (!timelineRef.current || !animation) return 0;

        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const timelineWidth = rect.width;
        const percentage = Math.max(0, Math.min(1, mouseX / timelineWidth));
        return percentage * animation.duration;
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>, keyframeTime?: number) => { // Added optional keyframeTime
        if (!animation) return;
        event.preventDefault(); 

        const timeAtMouse = getTimeFromMouseEvent(event);
        const keyframeHitTolerance = 5; 

        const rect = timelineRef.current?.getBoundingClientRect();
        if (!rect) return;

        let clickedKeyframeTime: number | undefined = undefined;
        if (keyframeTime !== undefined) { // If a keyframe marker was directly clicked
            clickedKeyframeTime = keyframeTime;
        } else { // Check if timeline track was clicked near a keyframe
            const foundKeyframe = animation.keyframes.find(kf => {
                if (!timelineRef.current) return false;
                const kfRect = timelineRef.current.getBoundingClientRect(); // Recalculate for precision
                const kfTimelineWidth = kfRect.width;
                const keyframeXPos = (kf.time / animation.duration) * kfTimelineWidth;
                return Math.abs(event.clientX - (kfRect.left + keyframeXPos)) < keyframeHitTolerance;
            });
            if (foundKeyframe) clickedKeyframeTime = foundKeyframe.time;
        }


        if (clickedKeyframeTime !== undefined) {
            if (!isPlaying) { 
                 draggingKeyframe.current = clickedKeyframeTime;
                 const keyframeX = (clickedKeyframeTime / animation.duration) * rect.width;
                 dragOffset.current = event.clientX - (rect.left + keyframeX);

                 document.addEventListener('mousemove', handleKeyframeDrag); 
                 document.addEventListener('mouseup', handleMouseUp);
                 setInternalSelectedKeyframeTime(clickedKeyframeTime); // Select it
            }
        } else {
             scrubbing.current = true; // Start scrubbing
             onScrub(timeAtMouse); // Scrub to the clicked time
             setInternalSelectedKeyframeTime(null); 
             document.addEventListener('mousemove', handleMouseMove);
             document.addEventListener('mouseup', handleMouseUp);
        }
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (scrubbing.current) {
            event.preventDefault(); 
            const time = getTimeFromMouseEvent(event);
            onScrub(time); // Call onScrub directly with the time value
        }
    };
    const handleKeyframeDrag = (event: MouseEvent) => {
        if (draggingKeyframe.current !== null && animation) {
            event.preventDefault(); 
            if (!timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const timelineWidth = rect.width;
            const mouseXWithOffset = event.clientX - rect.left - dragOffset.current;
            const percentage = Math.max(0, Math.min(1, mouseXWithOffset / timelineWidth));
            const newTime = percentage * animation.duration;
            onScrub(newTime); // Update current time during drag
        }
    };
    const handleMouseUp = (event: MouseEvent) => {
        event.preventDefault(); 

        if (scrubbing.current) {
            scrubbing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
        } else if (draggingKeyframe.current !== null && animation) {
            const finalMouseUpTime = getTimeFromMouseEvent(event); 
            onMoveKeyframe(draggingKeyframe.current, finalMouseUpTime); 
            draggingKeyframe.current = null;
            dragOffset.current = 0;
            document.removeEventListener('mousemove', handleKeyframeDrag);
        }
        // Remove mouseup listener from document universally after scrub or drag ends
        document.removeEventListener('mouseup', handleMouseUp);
    };


    const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
         if (!animation) return;
         event.preventDefault(); 
         const time = getTimeFromMouseEvent(event);

         const keyframeHitTolerance = 10; 
         const existingKeyframe = animation.keyframes.find(kf => {
              if (!timelineRef.current) return false;
              const rect = timelineRef.current.getBoundingClientRect();
              const timelineWidth = rect.width;
              const keyframeX = (kf.time / animation.duration) * timelineWidth;
              return Math.abs(event.clientX - (rect.left + keyframeX)) < keyframeHitTolerance;
         });


         if (existingKeyframe) {
             onDeleteKeyframe(existingKeyframe.time);
         } else {
              onAddKeyframe(time);
         }
    };

     const handleKeyframeClick = (event: React.MouseEvent<HTMLDivElement>, keyframeTime: number) => {
         event.preventDefault(); 
         event.stopPropagation(); 
         setInternalSelectedKeyframeTime(keyframeTime);
     };

     const handleDeleteSelectedKeyframe = () => {
         if (internalSelectedKeyframeTime !== null) {
             onDeleteKeyframe(internalSelectedKeyframeTime);
             setInternalSelectedKeyframeTime(null); 
         } else {
             console.warn("No keyframe selected to delete.");
         }
     };

    const handleAddKeyframeButtonClick = () => {
        onAddKeyframe(currentTime);
    };

    useEffect(() => {
        const mouseUpCleanup = () => {
            if (scrubbing.current) {
                scrubbing.current = false;
                document.removeEventListener('mousemove', handleMouseMove);
            }
            if (draggingKeyframe.current !== null) {
                draggingKeyframe.current = null;
                dragOffset.current = 0;
                document.removeEventListener('mousemove', handleKeyframeDrag);
            }
            document.removeEventListener('mouseup', mouseUpCleanup); // Self-remove
        };

        // If a drag or scrub starts, add the global mouseup listener
        if (scrubbing.current || draggingKeyframe.current !== null) {
            document.addEventListener('mouseup', mouseUpCleanup);
        }
    
        return () => {
            // Cleanup global listeners if component unmounts during an operation
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousemove', handleKeyframeDrag);
            document.removeEventListener('mouseup', mouseUpCleanup);
        };
    }, [scrubbing.current, draggingKeyframe.current]); // Rerun if drag/scrub state changes


    const formatTime = (timeInMs: number): string => {
        const seconds = Math.floor(timeInMs / 1000);
        const milliseconds = Math.round((timeInMs % 1000)); 
        return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
    };


    if (!animation) {
        return <div>No animation selected.</div>;
    }

    const currentPercentage = animation.duration > 0 ? (currentTime / animation.duration) * 100 : 0;


    return (
        <div className="timeline-controls-container" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', margin: '10px 0' }}>
            <h3>Timeline: {animation.name}</h3>
            <div className="playback-controls" style={{ marginBottom: '10px' }}>
                <button onClick={onPlay} disabled={isPlaying}>Play</button>
                <button onClick={onPause} disabled={!isPlaying}>Pause</button>
                <button onClick={onStop} disabled={currentTime === 0 && !isPlaying && (!animation.keyframes || animation.keyframes.length <= 1)}>Stop</button>
                <button onClick={handleDeleteSelectedKeyframe} disabled={internalSelectedKeyframeTime === null}>Delete Selected Keyframe</button>
                <button onClick={handleAddKeyframeButtonClick}>Add Keyframe at Current Time</button>
            </div>

            <div
                ref={timelineRef}
                style={{ 
                    position: 'relative',
                    height: '20px',
                    backgroundColor: '#eee',
                    cursor: scrubbing.current || draggingKeyframe.current !== null ? 'grabbing' : 'pointer',
                }}
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick} 
            >
                {/* Keyframe markers */}
                {animation.keyframes.map(kf => (
                    <div
                        key={kf.time}
                        style={{
                            position: 'absolute',
                            left: `${animation.duration > 0 ? (kf.time / animation.duration) * 100 : 0}%`,
                            top: '0',
                            width: '10px',
                            height: '100%',
                            backgroundColor: internalSelectedKeyframeTime === kf.time ? 'yellow' : 'red', 
                            outline: internalSelectedKeyframeTime === kf.time ? '2px solid blue' : 'none', 
                            cursor: 'grab',
                            transform: 'translateX(-50%)', 
                            zIndex: 1, 
                            boxSizing: 'border-box', 
                        }}
                        onMouseDown={(e) => handleMouseDown(e, kf.time)}
                         onClick={(e) => handleKeyframeClick(e, kf.time)} 
                    >
                    </div>
                ))}
                
                {/* Current time indicator (scrubber head) */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${currentPercentage}%`,
                        top: '0',
                        width: '3px', 
                        height: '100%',
                        backgroundColor: '#007bff', 
                        zIndex: 2, 
                         pointerEvents: 'none', 
                        transform: 'translateX(-50%)', 
                    }}
                ></div>
            </div>

            <div className="time-display" style={{ marginTop: '10px' }}>
                Current Time: {formatTime(currentTime)} / Duration: {formatTime(animation.duration)}
            </div>
        </div>
    );
};

export default Timeline;
