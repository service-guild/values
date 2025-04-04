import { Button } from '../components/Button';
import { Column } from '../components/Column';
import { FlashcardSorter } from '../components/FlashcardSorter';
import { useAppStore } from '../store/appStore';
import type { ValueCard as ValueCardType } from '../types/appState';

// Define column structure for Part 1 (used by Desktop view)
const part1Columns = [
  { id: 'unassigned', title: 'Unassigned' },
  { id: 'veryImportant', title: 'Very Important' },
  { id: 'important', title: 'Important' },
  { id: 'notImportant', title: 'Not Important' },
];

export function Part1View() {
  // Get cards from the Zustand store
  const cards = useAppStore((state) => state.cards);
  const unassignedCount = cards.filter((card) => card.column === 'unassigned').length;

  // Helper to filter cards for a specific column (for Desktop view)
  const getCardsForColumn = (columnId: string): ValueCardType[] => {
    return cards.filter((card) => card.column === columnId).sort((a, b) => a.order - b.order);
  };

  const handleNext = () => {
    // TODO: Implement navigation logic (go to Part 2)
    console.log('Next button clicked - Part 1');
  };

  return (
    <div className="flex flex-col h-full">
      <p className="mb-4 text-gray-600 flex-shrink-0">
        Sort the values below based on how important they are to you right now.
      </p>

      {/* --- Mobile View --- */}
      <div className="md:hidden flex-grow">
        <FlashcardSorter />
      </div>

      {/* --- Desktop Column Layout --- */}
      {/* Hidden on small screens, visible on medium and up */}
      <div className="hidden md:flex flex-row justify-center mb-4 flex-shrink-0">
        {part1Columns.map(({ id, title }) => (
          <Column key={id} title={title} columnId={id} cards={getCardsForColumn(id)} />
        ))}
      </div>

      {/* Navigation (Common to both views?) */}
      <div className="flex justify-end mt-4 flex-shrink-0">
        {unassignedCount === 0 && (
          <Button onClick={handleNext} id="toPart2">
            Next: Narrow Down
          </Button>
        )}
      </div>
    </div>
  );
}
