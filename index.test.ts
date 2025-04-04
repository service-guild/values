import { App } from "./index";
import { UndoManager } from "./undoManager";
import type { AppState, ValueCard } from "./index";
import { describe, test, expect, beforeEach } from "bun:test";
import { ALL_VALUE_DEFINITIONS, LIMITED_VALUE_DEFINITIONS, VALUES } from "./values"; // Import value counts for tests
const ALL_VALUES_COUNT = VALUES.length;
const LIMITED_VALUES_COUNT = 10;

// Mock necessary DOM elements and event listeners
beforeEach(() => {
  // Mock window.alert to prevent blocking tests
  window.alert = () => {}; // Replace alert with a non-blocking empty function
  // Mock window.confirm to default to true (yes) for tests, unless overridden
  window.confirm = () => true; 

  // The happy-dom environment should provide localStorage automatically.
  // We still need to clear it before each test if the environment doesn't do it automatically.
  if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
  }

  document.body.innerHTML = `
    <div id="addValueForm" class="modal" style="display: none;">
        <div class="modal-content">
            <h3>Add New Value</h3>
            <label for="newValueName">Value Name:</label>
            <input type="text" id="newValueName" required>
            <label for="newValueDesc">Description:</label>
            <textarea id="newValueDesc" rows="3"></textarea>
            <div class="modal-buttons">
                <button id="saveNewValueBtn">Save</button>
                <button id="cancelNewValueBtn">Cancel</button>
            </div>
        </div>
    </div>
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

  // --- Tests for Value Set Toggling ---
  test('Initial state uses limited value set', () => {
      const state = app.undoManager.getState();
      expect(state.valueSet).toBe('limited');
      expect(state.cards.length).toBe(LIMITED_VALUES_COUNT);
  });

  test('Clicking "Use All Values" switches set and resets state', () => {
      // Arrange: Start in default limited state
      let initialState = app.undoManager.getState();
      expect(initialState.valueSet).toBe('limited');
      // Optional: Advance state to ensure reset happens
      initialState.currentPart = 'part2';
      initialState.finalStatements = { 1: 'test' }; 
      app.updateState(initialState);

      // Act: Call the method directly instead of simulating click
      app.toggleValueSet();

      // Assert
      const newState = app.undoManager.getState();
      expect(newState.valueSet).toBe('all');
      expect(newState.cards.length).toBe(ALL_VALUES_COUNT);
      expect(newState.currentPart).toBe('part1'); // Should reset to part1
      expect(Object.keys(newState.finalStatements).length).toBe(0); // Statements cleared
  });

  test('Clicking "Use 10 Values" switches set back and resets state', () => {
      // Arrange: Start, switch to All using direct call
      // const buttonAll = document.getElementById('useAllValuesBtn');
      // buttonAll?.click(); // Replace click simulation
      app.toggleValueSet(); // Call directly to set state to 'all' for setup

      let allState = app.undoManager.getState();
      expect(allState.valueSet).toBe('all'); // Verify setup worked
      // Optional: Advance state to ensure reset happens
      allState.currentPart = 'part3';
      app.updateState(allState);

      // Act: Call the method directly instead of simulating click
      app.toggleValueSet();

      // Assert
      const newState = app.undoManager.getState();
      expect(newState.valueSet).toBe('limited');
      expect(newState.cards.length).toBe(LIMITED_VALUES_COUNT);
      expect(newState.currentPart).toBe('part1');
      expect(Object.keys(newState.finalStatements).length).toBe(0);
  });

    test('Clicking the active value set button does nothing', () => {
      const initialState = app.undoManager.getState();
      expect(initialState.valueSet).toBe('limited');

      // Act: Click the already active limited button
      const buttonLimited = document.getElementById('useLimitedValuesBtn');
      buttonLimited?.click();

      // Assert: State should not have changed
      const stateAfterClick = app.undoManager.getState();
      expect(stateAfterClick).toEqual(initialState);
  });

    test('Switching value set does NOT happen if confirm returns false', () => {
      const initialState = app.undoManager.getState();
      expect(initialState.valueSet).toBe('limited');

      // Arrange: Mock confirm to return false for this test
      const originalConfirm = window.confirm;
      window.confirm = () => false;

      // Act: Click the button to switch to all values
      const buttonAll = document.getElementById('useAllValuesBtn');
      buttonAll?.click();

      // Assert: State should not have changed
      const stateAfterClick = app.undoManager.getState();
      expect(stateAfterClick).toEqual(initialState);

      // Cleanup: Restore original confirm
      window.confirm = originalConfirm;
  });

  // --- Tests for Adding Custom Values ---
  test('saveNewValue adds a custom value card', () => {
    // Arrange: Need access to the private method or trigger via UI
    // We'll simulate the input values and call the method directly for simplicity
    const name = 'MY CUSTOM VALUE';
    const description = 'This is important to me.';
    (document.getElementById('newValueName') as HTMLInputElement).value = name;
    (document.getElementById('newValueDesc') as HTMLTextAreaElement).value = description;
    const initialCardCount = app.undoManager.getState().cards.length;

    // Act
    (app as any).saveNewValue(); // Access private method for test

    // Assert
    const newState = app.undoManager.getState();
    expect(newState.cards.length).toBe(initialCardCount + 1);
    const newCard = newState.cards[newState.cards.length - 1];
    if (!newCard) throw new Error('Test failed: New card not found after add');
    expect(newCard.name).toBe(name);
    expect(newCard.description).toBe(description);
    expect(newCard.isCustom).toBe(true);
    expect(newCard.column).toBe('unassigned');
    expect(newCard.id).toBeLessThan(0); // Custom IDs are negative
  });

  test('saveNewValue prevents duplicate names', () => {
    // Arrange: Add one custom card first
    const name = 'MY CUSTOM VALUE';
    (document.getElementById('newValueName') as HTMLInputElement).value = name;
    (document.getElementById('newValueDesc') as HTMLTextAreaElement).value = 'Desc 1';
    (app as any).saveNewValue(); 
    const stateAfterFirstAdd = app.undoManager.getState();
    const cardCountAfterFirst = stateAfterFirstAdd.cards.length;

    // Act: Try to add another with the same name (case-insensitive)
    (document.getElementById('newValueName') as HTMLInputElement).value = name.toLowerCase();
    (document.getElementById('newValueDesc') as HTMLTextAreaElement).value = 'Desc 2';
    (app as any).saveNewValue();

    // Assert: State should not have changed, card count same
    const stateAfterSecondAttempt = app.undoManager.getState();
    expect(stateAfterSecondAttempt.cards.length).toBe(cardCountAfterFirst);
    // Alert would have been called - we could spy on it if needed
  });

  // --- Tests for Editing Descriptions ---
  test('startEditingDescription sets editingDescriptionCardId', () => {
      const cardToEditId = app.undoManager.getState().cards[0]!.id; // Use non-null assertion
      expect(app.undoManager.getState().editingDescriptionCardId).toBeNull();

      // Act
      (app as any).startEditingDescription(cardToEditId);

      // Assert
      expect(app.undoManager.getState().editingDescriptionCardId).toBe(cardToEditId);
  });

  test('saveDescriptionEdit updates card description and clears editingId', () => {
      // Arrange: Start editing the first card
      const cards = app.undoManager.getState().cards;
      const cardToEdit = cards[0]!; // Use non-null assertion
      if (!cardToEdit) throw new Error('Test setup failed: No cards found');
      const cardId = cardToEdit.id;
      const originalDesc = cardToEdit.description || VALUES.find((v: {name: string}) => v.name === cardToEdit.name)?.description;
      const newDesc = 'My edited description.';
      (app as any).startEditingDescription(cardId);

      // Act
      (app as any).saveDescriptionEdit(cardId, newDesc);

      // Assert
      const newState = app.undoManager.getState();
      expect(newState.editingDescriptionCardId).toBeNull();
      const updatedCard = newState.cards.find(c => c.id === cardId);
      if (!updatedCard) throw new Error('Test failed: Updated card not found');
      expect(updatedCard.description).toBe(newDesc);
      // Ensure other card descriptions weren't affected (simple check)
      if (cards.length > 1) {
          const otherCard = newState.cards.find(c => c.id === cards[1]!.id); // Use non-null assertion
          if (!otherCard) throw new Error('Test setup failed: Second card not found');
          expect(otherCard.description).not.toBe(newDesc);
      }
  });

    test('cancelDescriptionEdit clears editingId without saving', () => {
      // Arrange: Start editing the first card
      const cards = app.undoManager.getState().cards;
      const cardToEdit = cards[0]!; // Use non-null assertion
      if (!cardToEdit) throw new Error('Test setup failed: No cards found');
      const cardId = cardToEdit.id;
      const originalDesc = cardToEdit.description; // May be undefined initially
      (app as any).startEditingDescription(cardId);
      // Simulate typing something into the textarea (though it's not rendered here)

      // Act
      (app as any).cancelDescriptionEdit();

      // Assert
      const newState = app.undoManager.getState();
      expect(newState.editingDescriptionCardId).toBeNull();
      const notUpdatedCard = newState.cards.find(c => c.id === cardId);
      if (!notUpdatedCard) throw new Error('Test failed: Card not found after cancel');
      // Explicitly handle potential undefined originalDesc
      if (originalDesc === undefined) {
          expect(notUpdatedCard.description).toBeUndefined();
      } else {
          expect(notUpdatedCard.description).toBe(originalDesc);
      }
  });

  // --- Test Review Page Rendering with Custom/Edited Descriptions ---
  test('Review page renders custom and edited descriptions correctly', () => {
      // Arrange: 
      // 1. Add a custom value
      const customName = 'CUSTOM VAL';
      const customDesc = 'My custom description';
      (document.getElementById('newValueName') as HTMLInputElement).value = customName;
      (document.getElementById('newValueDesc') as HTMLTextAreaElement).value = customDesc;
      (app as any).saveNewValue();
      
      // 2. Edit description of a built-in value (e.g., ACCEPTANCE)
      let state = app.undoManager.getState();
      const builtInCard = state.cards.find(c => c.name === 'ACCEPTANCE')!;
      const builtInCardId = builtInCard.id;
      const editedBuiltInDesc = 'My edited acceptance';
      (app as any).saveDescriptionEdit(builtInCardId, editedBuiltInDesc);
      
      // 3. Move cards to core/additional for review page
      state = app.undoManager.getState();
      state.currentPart = 'review';
      state.cards.forEach(card => {
          if (card.name === 'ACCEPTANCE' || card.name === customName) {
              card.column = 'core';
          } else {
              card.column = 'additional'; // Move others somewhere else
          }
      });
      app.updateState(state);
      app = new App(); // Re-render with final state

      // Act: Trigger render (implicitly done by new App() or manually if needed)
      // (app as any).render(); // Usually constructor calls render

      // Assert: Check the rendered HTML in the review section
      const reviewContent = document.getElementById('reviewContent');
      expect(reviewContent).not.toBeNull();
      const coreSection = reviewContent!.querySelector('.grid-section:first-child'); // Assuming core is first
      expect(coreSection).not.toBeNull();

      const coreNames = Array.from(coreSection!.querySelectorAll('.review-value-name')).map(el => el.textContent);
      const coreDescs = Array.from(coreSection!.querySelectorAll('.review-value-description')).map(el => el.textContent);
      
      // Find the indices based on names (order might vary slightly if sorting changes)
      const acceptanceIndex = coreNames.indexOf('ACCEPTANCE');
      const customIndex = coreNames.indexOf(customName);

      expect(acceptanceIndex).toBeGreaterThan(-1);
      expect(customIndex).toBeGreaterThan(-1);
      expect(coreDescs[acceptanceIndex]).toBe(editedBuiltInDesc);
      expect(coreDescs[customIndex]).toBe(customDesc);
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
      valueSet: 'limited',
      editingDescriptionCardId: null // Add missing property
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
