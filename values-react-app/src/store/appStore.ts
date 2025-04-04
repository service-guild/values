import { create } from 'zustand';

// Import value definitions
import { ALL_VALUE_DEFINITIONS, LIMITED_VALUE_DEFINITIONS, type ValueDefinition } from '../data/valueDefinitions';
import type { AppState, ValueCard } from '../types/appState';

// Helper function to create initial cards based on value set
const createInitialCards = (valueSet: 'limited' | 'all'): ValueCard[] => {
  const definitionsToUse = valueSet === 'all' ? ALL_VALUE_DEFINITIONS : LIMITED_VALUE_DEFINITIONS;
  return definitionsToUse.map(
    (definition: ValueDefinition, index: number): ValueCard => ({
      id: index + 1, // Use 1-based index for default cards
      name: definition.name,
      column: 'unassigned',
      order: index,
      description: undefined, // Built-in cards start with no description override
      isCustom: false,
    }),
  );
};

// Define the initial state values
const initialState: Omit<AppState, 'undoStack' | 'redoStack'> = {
  currentPart: 'part1',
  cards: createInitialCards('limited'), // Initialize cards using the helper
  finalStatements: {},
  valueSet: 'limited',
  editingDescriptionCardId: null,
};

// Base state type (without stacks)
type BaseAppState = Omit<AppState, 'undoStack' | 'redoStack'>;

// Actions interface
interface AppActions {
  setPart: (part: AppState['currentPart']) => void;
  assignCard: (cardId: number, columnId: string) => void;
  // TODO: Add other actions like toggleValueSet which would use createInitialCards
}

// Combined state and actions type for the base store
interface ZustandStore extends BaseAppState, AppActions {}

// Create the basic store without middleware for now
export const useAppStore = create<ZustandStore>((set) => ({
  ...initialState,

  // --- Actions --- //
  setPart: (part) => set({ currentPart: part }),

  // --- Add assignCard implementation ---
  assignCard: (cardId, columnId) =>
    set((state) => ({
      cards: state.cards.map((card) => (card.id === cardId ? { ...card, column: columnId } : card)),
    })),
  // --- End assignCard implementation ---

  // TODO: Implement other state update actions
  // TODO: Revisit Undo/Redo middleware integration later
  // TODO: Integrate persist middleware for localStorage
}));

// Convenience hooks (Undo/Redo disabled for now)
export const useUndo = () => () => {
  console.warn('Undo not implemented yet');
};
export const useRedo = () => () => {
  console.warn('Redo not implemented yet');
};
