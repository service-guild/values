import { valueDefinitionsMap } from '../data/valueDefinitions';
import type { ValueCard as ValueCardType } from '../types/appState';

interface ValueCardProps {
  card: ValueCardType;
}

export function ValueCard({ card }: ValueCardProps) {
  const description = card.description ?? valueDefinitionsMap.get(card.name) ?? '';

  return (
    <div
      className="w-full h-full p-6 border rounded-lg shadow-lg bg-white cursor-grab flex flex-col items-center justify-center text-center"
      data-testid={`value-card-${card.id}`}
    >
      <span className="font-semibold text-xl block mb-2">{card.name}</span>
      {description && <p className="text-lg text-gray-700 italic max-w-xs">{description}</p>}
      {/* TODO: Add drag handle */}
      {/* TODO: Add edit/save/cancel buttons for description */}
    </div>
  );
}
