import { App } from "./index";
import { UndoManager } from "./undoManager";
import type { AppState, ValueCard } from "./index";
import { describe, test, expect, beforeEach } from "bun:test";

// Mock necessary DOM elements and event listeners
beforeEach(() => {
  // Mock window.alert to prevent blocking tests
  window.alert = () => {}; // Replace alert with a non-blocking empty function

  // The happy-dom environment should provide localStorage automatically.
  // We still need to clear it before each test if the environment doesn't do it automatically.
  if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
  }

  document.body.innerHTML = `
    <div id="part1" class="exercise-part">Part 1 Content
        <div data-column="unassigned"><div id="part1-unassignedContainer" class="card-container"></div></div>
        <div data-column="veryImportant"><div id="part1-veryImportantContainer" class="card-container"></div></div>
        <div data-column="important"><div id="part1-importantContainer" class="card-container"></div></div>
        <div data-column="notImportant"><div id="part1-notImportantContainer" class="card-container"></div></div>
        <button id="toPart2"></button>
    </div>
    <div id="part2" class="exercise-part" style="display: none;">Part 2 Content
        <div data-column="unassigned"><div id="part2-unassignedContainer" class="card-container"></div></div>
        <div data-column="veryImportant"><div id="part2-veryImportantContainer" class="card-container"></div></div>
        <div data-column="important"><div id="part2-importantContainer" class="card-container"></div></div>
        <div data-column="notImportant"><div id="part2-notImportantContainer" class="card-container"></div></div>
        <button id="backToPart1"></button>
        <button id="toPart3"></button>
    </div>
    <div id="part3" class="exercise-part" style="display: none;">Part 3 Content
        <div data-column="core"><div id="coreContainer" class="card-container"></div></div>
        <div data-column="additional"><div id="additionalContainer" class="card-container"></div></div>
        <button id="backToPart2"></button>
        <button id="toPart4"></button>
    </div>
    <div id="part4" class="exercise-part" style="display: none;">
        Part 4 Content
        <div id="finalStatements"></div>
        <button id="backToPart3"></button>
        <button id="finish"></button>
    </div>
    <div id="review" class="exercise-part" style="display: none;">
        Part 5 Content
        <div id="reviewContent"></div>
        <button id="restart"></button>
    </div>
    <button id="undoBtn"></button>
    <button id="redoBtn"></button>
    <button id="clearStorageBtn"></button>
  `;
});

describe('Values Exercise App', () => {
  let app: App;
  let initialState: AppState;

  beforeEach(() => {
    // Initialize app before each test, using the mocked DOM
    app = new App(); 
    initialState = app.defaultState(); // Get initial state structure for comparison
  });

  test('Initial state should be correct', () => {
    const state = app.undoManager.getState();
    expect(state.currentPart).toBe('part1');
    expect(state.cards.length).toBeGreaterThan(0);
    expect(state.cards.every(c => c.column === 'unassigned')).toBe(true);
  });

  test('Part 1 to Part 2 transition moves only veryImportant cards', () => {
    // Arrange: Move some cards
    let state = app.undoManager.getState();
    // Add checks to ensure cards exist at these indices before modification
    if (state.cards.length < 3) {
        throw new Error("Test setup failed: Initial state should have at least 3 cards for this test.");
    }
    // Assign ALL cards to avoid blocking the transition due to the unassigned check
    state.cards.forEach((card, index) => {
        if (index === 0) {
            card.column = 'veryImportant';
        } else if (index === 1) {
            card.column = 'important';
        } else if (index === 2) {
            card.column = 'veryImportant';
        } else {
            card.column = 'notImportant'; // Assign all others
        }
    });
    app.updateState(state);

    // Act: Simulate clicking the button
    const button = document.getElementById('toPart2');
    button?.click();

    // Assert: Check the state after transition
    const part2State = app.undoManager.getState();
    expect(part2State.currentPart).toBe('part2');
    expect(part2State.cards.length).toBe(2);
    expect(part2State.cards.every(c => c.column === 'unassigned')).toBe(true);

    // Check names to be sure
    const cardNames = part2State.cards.map(c => c.name);
    // Add checks here too, although the length check above makes these safe
    if (initialState.cards.length < 3) {
         throw new Error("Test setup failed: Initial state lost cards unexpectedly.");
    }
    // Assign to variables first to help type inference
    const card0 = initialState.cards[0];
    const card1 = initialState.cards[1];
    const card2 = initialState.cards[2];

    // Add explicit checks for the variables (though length check implies they exist)
    if (!card0 || !card1 || !card2) {
        throw new Error("Test setup failed: Card elements are unexpectedly undefined.");
    }

    expect(cardNames).toContain(card0.name);
    expect(cardNames).toContain(card2.name);
    expect(cardNames).not.toContain(card1.name);
  });

  test('Part 1 to Part 2 transition BLOCKS if unassigned cards exist', () => {
    // Arrange: Leave some cards unassigned (initial state)
    const initialStateCards = app.undoManager.getState().cards;
    // Ensure there is at least one unassigned card
    expect(initialStateCards.some(c => c.column === 'unassigned')).toBe(true);

    // Act: Simulate clicking the button
    const button = document.getElementById('toPart2');
    button?.click();

    // Assert: Check that the state did NOT change
    const stateAfterClick = app.undoManager.getState();
    expect(stateAfterClick.currentPart).toBe('part1'); // Should still be in part1
    expect(stateAfterClick.cards).toEqual(initialStateCards); // Cards state should be unchanged
    // We could also spy on window.alert if needed
  });

  test('Part 2 to Part 4 transition SKIPS Part 3 if <= 5 veryImportant cards', () => {
    // Arrange: Setup state in Part 2 with 4 'veryImportant' cards
    let state = app.undoManager.getState();
    state.currentPart = 'part2'; // Manually set part for setup
    state.cards = [
      { id: 1, name: 'V1', column: 'veryImportant', order: 0 },
      { id: 2, name: 'V2', column: 'veryImportant', order: 1 },
      { id: 3, name: 'V3', column: 'veryImportant', order: 2 },
      { id: 4, name: 'V4', column: 'veryImportant', order: 3 },
      { id: 5, name: 'I1', column: 'important', order: 4 }, // Need some non-veryImportant too
    ];
    app.updateState(state); 
    // Note: Need to re-bind listeners if updateState doesn't do it, 
    // but our simple listener binding in constructor might suffice if DOM isn't fully replaced.
    // For robustness, re-creating App instance or re-binding might be better in complex scenarios.
    app = new App(); // Re-create to ensure listeners are bound to correct state/DOM
    
    // Act: Click the 'Next' button (toPart3)
    const button = document.getElementById('toPart3');
    button?.click();

    // Assert: Should be in Part 4, and cards should be 'core'
    const part4State = app.undoManager.getState();
    expect(part4State.currentPart).toBe('part4'); // Should skip to part4
    expect(part4State.cards.length).toBe(4); // Only the 4 veryImportant cards remain
    expect(part4State.cards.every(c => c.column === 'core')).toBe(true);
  });

  test('Part 3 to Part 4 transition BLOCKS if > 5 core cards', () => {
    // Arrange: Setup state in Part 3 with 6 'core' cards
    let state = app.undoManager.getState();
    state.currentPart = 'part3';
    state.cards = [
      { id: 1, name: 'C1', column: 'core', order: 0 },
      { id: 2, name: 'C2', column: 'core', order: 1 },
      { id: 3, name: 'C3', column: 'core', order: 2 },
      { id: 4, name: 'C4', column: 'core', order: 3 },
      { id: 5, name: 'C5', column: 'core', order: 4 },
      { id: 6, name: 'C6', column: 'core', order: 5 },
    ];
    app.updateState(state);
    app = new App(); // Re-create for listeners

    // Act: Click the 'Next' button (toPart4)
    const button = document.getElementById('toPart4');
    button?.click();

    // Assert: Should still be in Part 3
    const stateAfterClick = app.undoManager.getState();
    expect(stateAfterClick.currentPart).toBe('part3'); 
  });

    test('Part 3 to Part 4 transition SUCCEEDS if <= 5 core cards', () => {
    // Arrange: Setup state in Part 3 with 5 'core' cards
    let state = app.undoManager.getState();
    state.currentPart = 'part3';
    state.cards = [
      { id: 1, name: 'C1', column: 'core', order: 0 },
      { id: 2, name: 'C2', column: 'core', order: 1 },
      { id: 3, name: 'C3', column: 'core', order: 2 },
      { id: 4, name: 'C4', column: 'core', order: 3 },
      { id: 5, name: 'C5', column: 'core', order: 4 },
      { id: 6, name: 'A1', column: 'additional', order: 5 }, // One additional
    ];
    app.updateState(state);
    app = new App(); // Re-create for listeners

    // Act: Click the 'Next' button (toPart4)
    const button = document.getElementById('toPart4');
    button?.click();

    // Assert: Should be in Part 4
    const part4State = app.undoManager.getState();
    expect(part4State.currentPart).toBe('part4'); 
    // Cards state should remain the same (core/additional separation is kept)
    expect(part4State.cards.filter(c => c.column === 'core').length).toBe(5);
    expect(part4State.cards.filter(c => c.column === 'additional').length).toBe(1);
  });

  // Add more tests for other transitions (Part 2 -> 3, 3 -> 4, etc.)
  // Add tests for card movement logic (moveCard)
  // Add tests for final statement input
  // Add tests for review screen rendering
});

describe('UndoManager', () => {
  let initialState: AppState;
  let um: UndoManager<AppState>;

  beforeEach(() => {
    // Create a sample initial state for testing UndoManager independently
    initialState = {
      currentPart: 'part1',
      cards: [
        { id: 1, name: 'TEST1', column: 'unassigned', order: 0 },
        { id: 2, name: 'TEST2', column: 'unassigned', order: 1 },
      ],
      finalStatements: {},
    };
    um = new UndoManager(initialState);
  });

  test('should return the initial state', () => {
    expect(um.getState()).toEqual(initialState);
    expect(um.canUndo()).toBe(false);
    expect(um.canRedo()).toBe(false);
  });

  test('should execute a state change and update current state', () => {
    const newState = { ...initialState, currentPart: 'part2' as 'part2' }; // Explicit type assertion
    um.execute(newState);
    expect(um.getState()).toEqual(newState);
    expect(um.canUndo()).toBe(true);
    expect(um.canRedo()).toBe(false);
  });

  test('should undo the last state change', () => {
    const newState = { ...initialState, currentPart: 'part2' as 'part2' };
    um.execute(newState);
    const undoneState = um.undo();
    expect(undoneState).toEqual(initialState);
    expect(um.getState()).toEqual(initialState);
    expect(um.canUndo()).toBe(false);
    expect(um.canRedo()).toBe(true);
  });

  test('should redo the undone state change', () => {
    const newState = { ...initialState, currentPart: 'part2' as 'part2' };
    um.execute(newState);
    um.undo();
    const redoneState = um.redo();
    expect(redoneState).toEqual(newState);
    expect(um.getState()).toEqual(newState);
    expect(um.canUndo()).toBe(true);
    expect(um.canRedo()).toBe(false);
  });

  test('should clear redo stack on new execution after undo', () => {
    const state2 = { ...initialState, currentPart: 'part2' as 'part2' };
    const state3 = { ...initialState, currentPart: 'part3' as 'part3' };
    um.execute(state2);
    um.undo(); // Back to initialState, state2 is in redo stack
    um.execute(state3); // Execute a new change

    expect(um.getState()).toEqual(state3);
    expect(um.canUndo()).toBe(true); // Can undo state3
    expect(um.canRedo()).toBe(false); // Redo stack (state2) should be cleared
    
    // Check undo goes back to initial state, not state 2
    const undoneState = um.undo();
    expect(undoneState).toEqual(initialState);
  });

  test('should handle multiple undo/redo operations', () => {
    const state2 = { ...initialState, currentPart: 'part2' as 'part2' };
    const state3 = { ...initialState, currentPart: 'part3' as 'part3' };
    um.execute(state2);
    um.execute(state3);

    expect(um.getState()).toEqual(state3);
    um.undo();
    expect(um.getState()).toEqual(state2);
    um.undo();
    expect(um.getState()).toEqual(initialState);
    expect(um.canUndo()).toBe(false);
    expect(um.canRedo()).toBe(true);

    um.redo();
    expect(um.getState()).toEqual(state2);
    um.redo();
    expect(um.getState()).toEqual(state3);
    expect(um.canRedo()).toBe(false);
    expect(um.canUndo()).toBe(true);
  });

  test('undo/redo should return null when stacks are empty', () => {
    expect(um.undo()).toBeNull();
    expect(um.redo()).toBeNull();
    const state2 = { ...initialState, currentPart: 'part2' as 'part2' };
    um.execute(state2);
    expect(um.redo()).toBeNull(); // Still no redo
    um.undo();
    expect(um.undo()).toBeNull(); // Already at start
  });
}); 
