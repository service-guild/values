// Defines the structure for a single value card
export interface ValueCard {
  id: number;
  name: string;
  column: string; // Tracks assignment: "unassigned", "notImportant", "important", "veryImportant", "core", "additional"
  order: number; // Used for visual ordering, potentially within columns
  description?: string; // User-provided description override or custom description
  isCustom?: boolean; // Flag for custom cards
}

// Defines the overall shape of the application's state
export interface AppState {
  currentPart: 'part1' | 'part2' | 'part3' | 'part4' | 'review';
  cards: ValueCard[];
  finalStatements: Record<number, string>; // Statements keyed by card ID for Part 4
  valueSet: 'limited' | 'all'; // Tracks which set of values is being used
  editingDescriptionCardId: number | null; // ID of card being edited, or null

  // Fields for integrated undo/redo functionality
  // These hold snapshots of the AppState itself
  undoStack: AppState[];
  redoStack: AppState[];
}
