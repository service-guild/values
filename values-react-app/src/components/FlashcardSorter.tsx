import React, { useEffect, useState } from 'react';
import { type SwipeEventData, useSwipeable } from 'react-swipeable';

import { useAppStore } from '../store/appStore';
import { Button } from './Button';
// import type { AppState } from '../types/appState'; // Remove unused import
import { ValueCard } from './ValueCard';

// Import type

// Define assignment categories for Part 1/2
const assignmentCategories = [
  { id: 'veryImportant', title: 'Very Important', variant: 'primary' as const, swipeDir: 'Down' },
  { id: 'important', title: 'Important', variant: 'secondary' as const, swipeDir: 'Right' },
  { id: 'notImportant', title: 'Not Important', variant: 'secondary' as const, swipeDir: 'Left' },
];

// Define minimum swipe distance threshold (pixels)
const SWIPE_THRESHOLD = 60;
const ROTATION_FACTOR = 15; // Controls how much the card rotates based on horizontal distance (lower means more rotation)
const EXIT_ANIMATION_DURATION = 300; // ms, should match CSS transition

export function FlashcardSorter() {
  // Get state and action from the store
  const cards = useAppStore((state) => state.cards);
  const assignCard = useAppStore((state) => state.assignCard); // Get the action

  // State for visual feedback during swipe
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  // State to manage the exit animation direction
  const [isExiting, setIsExiting] = useState<'left' | 'right' | 'down' | null>(null);

  // Keep track of the card ID that is currently exiting
  const currentCardIdRef = React.useRef<number | null>(null);

  // Find the next unassigned card (lowest order)
  const nextUnassignedCard = cards
    .filter((card) => card.column === 'unassigned' && card.id !== (isExiting ? currentCardIdRef.current : null)) // Prevent flickering during exit
    .sort((a, b) => a.order - b.order)[0]; // Get the first one

  if (!isExiting && nextUnassignedCard) {
    currentCardIdRef.current = nextUnassignedCard.id;
  }

  const unassignedCount = cards.filter((card) => card.column === 'unassigned').length;

  // Reset swipe state visually
  const resetSwipeState = () => {
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
    // Don't reset isExiting here, useEffect handles it
  };

  // Check threshold and assign card
  const handleSwipeEnd = (columnId: string, eventData: SwipeEventData) => {
    if (!nextUnassignedCard || isExiting) return; // Don't process if already exiting

    const distance = Math.sqrt(eventData.deltaX ** 2 + eventData.deltaY ** 2);
    if (distance >= SWIPE_THRESHOLD) {
      // Trigger exit animation instead of immediate assignment
      if (columnId === 'notImportant') setIsExiting('left');
      else if (columnId === 'important') setIsExiting('right');
      else if (columnId === 'veryImportant') setIsExiting('down');
      // Do not call assignCard or resetSwipeState here
    } else {
      resetSwipeState(); // Animate back if threshold not met
    }
  };

  // Effect to handle the actual card assignment after the exit animation
  useEffect(() => {
    if (isExiting && currentCardIdRef.current) {
      const exitDir = isExiting;
      const cardIdToAssign = currentCardIdRef.current;

      const timer = setTimeout(() => {
        let columnId: string;
        if (exitDir === 'left') columnId = 'notImportant';
        else if (exitDir === 'right') columnId = 'important';
        else columnId = 'veryImportant'; // Must be 'down'

        assignCard(cardIdToAssign, columnId);
        setIsExiting(null); // Reset exit state
        resetSwipeState(); // Reset visual offset for the *next* card render
      }, EXIT_ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [isExiting, assignCard]);

  // Setup swipe handlers
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      if (isExiting) return; // Disable swiping during exit animation
      if (!isSwiping) setIsSwiping(true);
      setSwipeOffset({ x: eventData.deltaX, y: eventData.deltaY });
    },
    onSwipedLeft: (eventData) => handleSwipeEnd('notImportant', eventData),
    onSwipedRight: (eventData) => handleSwipeEnd('important', eventData),
    onSwipedDown: (eventData) => handleSwipeEnd('veryImportant', eventData),
    onSwiped: () => {
      if (!isSwiping || isExiting) return; // Don't snap back if exiting or not swiping
      // Snap back if swipe cancelled without meeting threshold
      setIsSwiping(false);
      setSwipeOffset({ x: 0, y: 0 });
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  // Calculate rotation based on horizontal offset
  const rotation =
    isExiting ?
      isExiting === 'left' ? -30
      : isExiting === 'right' ? 30
      : 0
    : swipeOffset.x / ROTATION_FACTOR;

  // Dynamic style for the card wrapper including rotation
  let transform = `translate(${swipeOffset.x}px, ${swipeOffset.y}px) rotate(${rotation}deg)`;
  let opacity = 1;

  // Apply exit transform and opacity
  if (isExiting === 'left') {
    transform = `translate(-150%, ${swipeOffset.y}px) rotate(-30deg)`;
    opacity = 0;
  } else if (isExiting === 'right') {
    transform = `translate(150%, ${swipeOffset.y}px) rotate(30deg)`;
    opacity = 0;
  } else if (isExiting === 'down') {
    transform = `translate(${swipeOffset.x}px, 150%) rotate(${rotation}deg)`;
    opacity = 0;
  }

  // Apply transition during snap-back OR during exit animation
  const transition =
    (!isSwiping && !isExiting) || isExiting ?
      `transform ${EXIT_ANIMATION_DURATION / 1000}s cubic-bezier(0.25, 0.8, 0.25, 1), opacity ${EXIT_ANIMATION_DURATION / 1000}s ease-out`
    : 'none';

  const cardWrapperStyle: React.CSSProperties = {
    transform,
    opacity,
    transition,
  };

  // Determine which card to display (current one if exiting, otherwise next unassigned)
  const cardToDisplay = isExiting ? cards.find((c) => c.id === currentCardIdRef.current) : nextUnassignedCard;

  return (
    // Use height of parent
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full pt-2 pb-2">
      <p className="mb-2 text-sm text-gray-500 flex-shrink-0">{unassignedCount} remaining</p>

      {/* Card area: Allow shrinking if needed, handle internal overflow */}
      <div className="flex-grow w-full flex items-center justify-center p-4 relative overflow-hidden min-h-0 overflow-y-auto">
        {cardToDisplay ?
          <div
            key={cardToDisplay.id}
            className="w-full h-full max-w-sm touch-none cursor-grab"
            style={cardWrapperStyle}
            {...swipeHandlers}
          >
            <ValueCard card={cardToDisplay} />
          </div>
        : !isExiting && (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-green-600 font-semibold py-4">All values sorted for this part!</p>
            </div>
          )
        }
      </div>

      {/* Instructions and Buttons container: Reduce padding */}
      <div className="w-full p-4 flex-shrink-0">
        {' '}
        {/* Reduced padding from p-6 to p-4 */}
        {/* Swipe instructions */}
        {cardToDisplay && (
          <div className="text-xs text-gray-500 mb-2 text-center">
            {' '}
            {/* Reduced bottom margin */}
            Swipe: <span className="font-semibold">Left</span> (Not Imp.), <span className="font-semibold">Right</span>{' '}
            (Imp.), <span className="font-semibold">Down</span> (Very Imp.)
            <br /> or use buttons below
          </div>
        )}
        {/* Buttons */}
        <div className="flex justify-around w-full">
          {assignmentCategories.map(({ id, title, variant }) => (
            <Button
              key={id}
              variant={variant}
              onClick={() => {
                // Trigger exit animation via button click too
                if (!cardToDisplay || isExiting) return;
                if (id === 'notImportant') setIsExiting('left');
                else if (id === 'important') setIsExiting('right');
                else if (id === 'veryImportant') setIsExiting('down');
              }}
              className="flex-1 mx-1 text-sm"
              disabled={!!isExiting || !cardToDisplay}
            >
              {title}
            </Button>
          ))}
        </div>
      </div>
      {/* TODO: Add category overview section */}
    </div>
  );
}
