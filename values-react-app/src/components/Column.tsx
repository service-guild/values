import type { ValueCard as ValueCardType } from '../types/appState';
import { ValueCard } from './ValueCard';

interface ColumnProps {
  title: string;
  columnId: string; // Identifier for the column (e.g., 'unassigned', 'veryImportant')
  cards: ValueCardType[];
}

export function Column({ title, columnId, cards }: ColumnProps) {
  return (
    <div
      className="flex flex-col p-4 border rounded bg-gray-50 min-h-[200px] w-1/4 mx-1" // Basic styling, adjust width as needed
      data-testid={`column-${columnId}`}
    >
      <h3 className="text-lg font-semibold mb-3 text-center border-b pb-2">{title}</h3>
      <div className="flex-grow">
        {cards.length === 0 ?
          <p className="text-sm text-gray-500 text-center italic">Empty</p>
        : cards.map((card) => <ValueCard key={card.id} card={card} />)}
      </div>
      {/* Drop zone logic will be added later with dnd-kit */}
    </div>
  );
}
