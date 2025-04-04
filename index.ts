// Define interfaces for our value cards and overall app state.
export interface ValueCard {
  id: number;
  name: string;
  column: string; // Part1: "unassigned", "notImportant", "important", "veryImportant"
  // Part2: same as Part1
  // Part3: "core" or "additional" (for cards carried over from veryImportant)
  order: number;
}

export interface AppState {
  currentPart: "part1" | "part2" | "part3" | "part4" | "review";
  cards: ValueCard[];
  // In part 4, user can add final statements for each core value (by card id)
  finalStatements: { [cardId: number]: string };
  valueSet: 'limited' | 'all'; // Add state for current value set
}

// Import the UndoManager from its own file
import { UndoManager } from './undoManager';
// Import the original VALUES array
import { VALUES } from './values'; 
// Import debounce and the necessary type from lodash
import { debounce } from 'lodash'; 
import type { DebouncedFunc } from 'lodash'; // Use type-only import

// Define the structure based on the imported VALUES
interface ValueDefinition {
    name: string;
    description: string;
}

// Recreate ALL_VALUES and LIMITED_VALUES based on the import
const ALL_VALUE_DEFINITIONS: ValueDefinition[] = VALUES;
const LIMITED_VALUE_DEFINITIONS = ALL_VALUE_DEFINITIONS.slice(0, 10);

// Create a global map for easy description lookup
const valueDefinitionsMap = new Map<string, string>(
    ALL_VALUE_DEFINITIONS.map((def: ValueDefinition) => [def.name, def.description])
);

// Main application class
export class App {
  private state: AppState;
  public undoManager: UndoManager<AppState>;
  private storageKey: string = "valuesExerciseState";
  // Update type annotation to use DebouncedFunc
  private debouncedUpdateFinalStatement: DebouncedFunc<(cardId: number, value: string) => void>;

  constructor() {
    // Load state from localStorage or initialize default state.
    const saved = localStorage.getItem(this.storageKey);
    let initialState: AppState;
    if (saved) {
      try {
        initialState = JSON.parse(saved) as AppState;
        // Ensure valueSet exists in saved state, default if not
        if (!initialState.valueSet) {
            initialState.valueSet = 'limited'; 
        }
      } catch {
        initialState = this.defaultState('limited'); // Default to limited on error
      }
    } else {
      initialState = this.defaultState('limited'); // Default to limited initially
    }
    this.state = initialState; // Set initial state before UndoManager
    this.undoManager = new UndoManager<AppState>(this.state);

    // Re-add initialization using lodash debounce
    this.debouncedUpdateFinalStatement = debounce((cardId: number, value: string) => {
        const newState = this.undoManager.getState();
        newState.finalStatements[cardId] = value;
        this.updateState(newState);
    }, 500);

    this.bindEventListeners();
    this.render();
    this.updateUndoRedoButtons();
  }

  // Default state with sample value cards based on the selected set
  public defaultState(valueSet: 'limited' | 'all' = 'limited'): AppState {
    const definitionsToUse = valueSet === 'all' ? ALL_VALUE_DEFINITIONS : LIMITED_VALUE_DEFINITIONS;
    const sampleCards: ValueCard[] = definitionsToUse.map((definition: ValueDefinition, index: number) => ({
      id: index + 1,
      name: definition.name, // Use name from definition
      column: "unassigned",
      order: index,
    }));
    return {
      currentPart: "part1",
      cards: sampleCards,
      finalStatements: {},
      valueSet: valueSet, // Store the set used
    };
  }

  // Save the state to localStorage.
  private saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  // Update state via the undoManager then re-render.
  public updateState(newState: AppState) {
    this.undoManager.execute(newState);
    this.state = this.undoManager.getState();
    this.saveState();
    this.render();
    this.updateUndoRedoButtons();
  }

  // Method to toggle between limited and all values
  public toggleValueSet() {
    const currentState = this.undoManager.getState();
    const nextSet = currentState.valueSet === 'limited' ? 'all' : 'limited';
    // Generate a fresh default state for the *new* set, resetting progress
    const newState = this.defaultState(nextSet);
    // Execute this change through the undo manager
    this.updateState(newState);
  }

  // Bind event listeners for UI interactions.
  private bindEventListeners() {
    const appInstance = this; // Capture the App instance

    // Navigation buttons
    document.getElementById("toPart2")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      // Check for unassigned cards before proceeding
      const unassignedCount = newState.cards.filter(card => card.column === 'unassigned').length;
      if (unassignedCount > 0) {
        alert(`Please sort all ${unassignedCount} unassigned value(s) before proceeding to Part 2.`);
        return;
      }
      newState.currentPart = "part2";
      newState.cards = newState.cards
        .filter(card => card.column === "veryImportant")
        .map(card => ({ ...card, column: "unassigned" }));
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("toPart3")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      // Check for unassigned cards before proceeding
      const unassignedCount = newState.cards.filter(card => card.column === 'unassigned').length;
      if (unassignedCount > 0) {
        alert(`Please sort all ${unassignedCount} unassigned value(s) before proceeding.`);
        return;
      }
      const veryImportantCards = newState.cards.filter((c) => c.column === "veryImportant");
      const veryImportantCount = veryImportantCards.length;

      if (veryImportantCount <= 5) {
        newState.currentPart = "part4";
      } else {
        newState.currentPart = "part3";
      }
      // Move all "veryImportant" cards to "core" regardless of the next part
      newState.cards = veryImportantCards.map((c, idx) => ({ ...c, column: "core", order: idx }));

      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("toPart4")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      const coreCount = newState.cards.filter((c) => c.column === "core").length;
      if (coreCount > 5) {
        alert("You can only have 5 core values! Please move some values to 'Also Something I Want' before continuing.");
        return; // Don't update state if validation fails
      }
      newState.currentPart = "part4";
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("finish")?.addEventListener("click", () => {
      // Flush any pending debounced updates immediately
      this.debouncedUpdateFinalStatement.flush();

      const newState = this.undoManager.getState();
      // Check if all core values have statements
      const coreCards = newState.cards.filter(c => c.column === 'core');
      const missingStatements = coreCards.filter(card => !newState.finalStatements[card.id]?.trim());

      if (missingStatements.length > 0) {
          alert(`Please provide a statement for all core values. Missing: ${missingStatements.map(c => c.name).join(', ')}`);
          return; // Prevent transition
      }
      
      // Original transition logic
      newState.currentPart = "review";
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("restart")?.addEventListener("click", () => {
      const newState = this.defaultState();
      this.updateState(newState); // Call updateState directly
    });

    // --- Add listeners for the toggle buttons ---
    document.getElementById("useLimitedValuesBtn")?.addEventListener("click", () => {
        // Use captured instance
        const currentSet = appInstance.undoManager.getState().valueSet;
        if (currentSet !== 'limited') {
            if (confirm("Switching value sets will reset your current progress. Are you sure?")) {
                appInstance.toggleValueSet(); // Use captured instance
            }
        }
    });
    document.getElementById("useAllValuesBtn")?.addEventListener("click", () => {
        // Use captured instance
        const currentSet = appInstance.undoManager.getState().valueSet;
        if (currentSet !== 'all') {
            if (confirm("Switching value sets will reset your current progress. Are you sure?")) {
                appInstance.toggleValueSet(); // Use captured instance
            }
        }
    });

    // Undo/Redo buttons
    document.getElementById("undoBtn")?.addEventListener("click", () => {
      const prev = this.undoManager.undo();
      if (prev) {
        this.state = prev;
        this.saveState();
        this.render();
        this.updateUndoRedoButtons();
      }
    });
    document.getElementById("redoBtn")?.addEventListener("click", () => {
      const next = this.undoManager.redo();
      if (next) {
        this.state = next;
        this.saveState();
        this.render();
        this.updateUndoRedoButtons();
      }
    });

    // Clear storage button (renamed to Restart exercise)
    document.getElementById("clearStorageBtn")?.addEventListener("click", () => {
      // Update confirmation message
      if (confirm("Are you sure you want to restart the exercise? All progress will be lost. This action cannot be undone.")) {
        localStorage.removeItem(this.storageKey);
        // Reset to the default state using the *current* value set preference
        const newState = this.defaultState(this.state.valueSet); 
        this.updateState(newState);
      }
    });

    // Set up drag and drop for card movement in all card-container elements.
    const containers = document.querySelectorAll(".card-container");
    containers.forEach((container) => {
      container.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      container.addEventListener("drop", (e) => {
        e.preventDefault();
        const dragEvent = e as DragEvent;
        const cardId = Number(dragEvent.dataTransfer?.getData("text/plain"));
        const targetColumn = (
          container.parentElement as HTMLElement
        ).getAttribute("data-column");
        if (targetColumn) {
          this.moveCard(cardId, targetColumn);
        }
      });
    });
  }

  // Moves a card (by id) to a new column.
  private moveCard(cardId: number, newColumn: string) {
    const newState = this.undoManager.getState();
    const card = newState.cards.find((c) => c.id === cardId);
    if (card) {
      // If in Part3 and moving to the 'core' column, enforce a maximum of 5 core cards.
      if (newState.currentPart === "part3" && newColumn === "core") {
        const coreCount = newState.cards.filter(
          (c) => c.column === "core"
        ).length;
        if (coreCount >= 5 && card.column !== "core") {
          alert("You can only have 5 core values!");
          return;
        }
      }
      card.column = newColumn;
      // Optionally, update order if needed (here we simply set order to current timestamp).
      card.order = Date.now();
      this.updateState(newState);
    }
  }

  // Creates a draggable card element, now including the description.
  private createCardElement(card: ValueCard): HTMLElement {
    const cardElem = document.createElement("div");
    cardElem.className = "card";
    cardElem.draggable = true;
    cardElem.dataset.cardId = card.id.toString();

    // Create elements for name and description
    const nameElem = document.createElement("span");
    nameElem.className = "card-name";
    nameElem.textContent = card.name;

    const descriptionElem = document.createElement("span");
    descriptionElem.className = "card-description";
    // Look up description from the map
    descriptionElem.textContent = valueDefinitionsMap.get(card.name) || ""; 

    cardElem.appendChild(nameElem);
    cardElem.appendChild(descriptionElem);

    cardElem.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", card.id.toString());
    });
    return cardElem;
  }

  // Render the UI based on the current state.
  private render() {
    // Manage tabindex for global controls based on current part
    const isPart4Active = this.state.currentPart === "part4";
    const globalControls = document.querySelectorAll('#global-controls button');
    globalControls.forEach(btn => {
        if (isPart4Active) {
            (btn as HTMLElement).tabIndex = -1; // Make header buttons non-tabbable during Part 4
        } else {
            (btn as HTMLElement).removeAttribute('tabindex'); // Restore default tabbability
        }
    });

    // Hide all parts first.
    document.querySelectorAll(".exercise-part").forEach((section) => {
      (section as HTMLElement).style.display = "none";
    });
    // Show the current part.
    const partElem = document.getElementById(this.state.currentPart);
    if (partElem) {
      partElem.style.display = "block";
    }
    // Render cards for the current part.
    if (this.state.currentPart === "part1") {
      // Clear containers for Part 1
      [
        "part1-unassignedContainer",
        "part1-veryImportantContainer",
        "part1-importantContainer",
        "part1-notImportantContainer",
      ].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = "";
      });
      // Render each card into its Part 1 container.
      this.state.cards.forEach((card) => {
        const containerId = "part1-" + card.column + "Container"; // Use Part 1 prefix
        const container = document.getElementById(containerId);
        if (container) {
          const cardElem = this.createCardElement(card); // Use helper
          container.appendChild(cardElem);
        }
      });
    } else if (this.state.currentPart === "part2") {
      // Clear containers for Part 2
      [
        "part2-unassignedContainer",
        "part2-veryImportantContainer",
        "part2-importantContainer",
        "part2-notImportantContainer",
      ].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = "";
      });
      
      // Log the state for debugging (can be removed later)
      // console.log("Rendering Part 2:", {
      //   totalCards: this.state.cards.length,
      //   cards: this.state.cards.map(c => ({ name: c.name, column: c.column }))
      // });
      
      // In Part 2, show all cards in their current Part 2 columns
      this.state.cards.forEach((card) => {
        const containerId = "part2-" + card.column + "Container"; // Use Part 2 prefix
        const container = document.getElementById(containerId);
        if (container) {
          const cardElem = this.createCardElement(card); // Use helper
          container.appendChild(cardElem);
        } else {
          // Log error if container not found (can be removed later)
          // console.error(`Container not found for card ${card.name} in column ${card.column}`);
        }
      });
    } else if (this.state.currentPart === "part3") {
      // Clear containers for part3
      ["coreContainer", "additionalContainer"].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = "";
      });
      this.state.cards.forEach((card) => {
        if (card.column === "core" || card.column === "additional") {
          const containerId = card.column + "Container";
          const container = document.getElementById(containerId);
          if (container) {
            const cardElem = this.createCardElement(card); // Use helper
            container.appendChild(cardElem);
          }
        }
      });
    } else if (this.state.currentPart === "part4") {
      // Render text inputs for each core value.
      const finalStatementsContainer = document.getElementById("finalStatements");
      if (finalStatementsContainer) {
        const coreCards = this.state.cards.filter((c) => c.column === "core");
        coreCards.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorting for consistent order

        // Check if inputs matching core cards already exist
        const existingInputs = finalStatementsContainer.querySelectorAll<HTMLInputElement>('input[type="text"]');
        let inputsMatch = existingInputs.length === coreCards.length;
        if (inputsMatch) {
            existingInputs.forEach((input, index) => {
                // Verify the input corresponds to the correct card (using id or other attribute if needed)
                // For simplicity, we assume order matches due to sorting if length is correct
                if (coreCards[index]?.id.toString() !== input.id.replace('statement-', '')) {
                    inputsMatch = false;
                }
            });
        }

        if (inputsMatch) {
          // Inputs exist and match: Just update their values
          existingInputs.forEach((input) => {
            const cardId = Number(input.id.replace('statement-', ''));
            const currentValue = this.state.finalStatements[cardId] || "";
            if (input.value !== currentValue) {
              input.value = currentValue;
            }
          });
        } else {
          // Inputs don't exist or don't match: Clear and recreate them
          finalStatementsContainer.innerHTML = ""; 
          coreCards.forEach((card, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "final-statement";
            const label = document.createElement("label");
            label.htmlFor = `statement-${card.id}`;
            label.textContent = `Describe what "${card.name}" means to you:`;
            const input = document.createElement("input");
            input.type = "text";
            input.id = `statement-${card.id}`;
            input.value = this.state.finalStatements[card.id] || "";
            // Use 'input' event to call the debounced update function
            input.addEventListener("input", () => {
              // Call the debounced function, passing necessary info
              this.debouncedUpdateFinalStatement(card.id, input.value);
            });
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            finalStatementsContainer.appendChild(wrapper);
          });
        }
      }
    } else if (this.state.currentPart === "review") {
      const reviewContent = document.getElementById("reviewContent");
      if (reviewContent) {
        reviewContent.innerHTML = "";
        
        // Add the visualization grid
        const grid = document.createElement("div");
        grid.className = "values-grid";
        
        // Create sections for core values and additional values
        const categories = [
          { title: "Core Values (F*CK YEAH)", column: "core" },
          { title: "Also Something I Want", column: "additional" }
        ];
        
        categories.forEach(category => {
          const section = document.createElement("div");
          section.className = "grid-section";
          const title = document.createElement("h3");
          title.textContent = category.title;
          section.appendChild(title);
          
          const values = this.state.cards
            .filter(c => c.column === category.column)
            .map(c => c.name); // Keep getting just the names for this list
          
          if (values.length > 0) {
            const list = document.createElement("ul");
            values.forEach(value => {
              const li = document.createElement("li");
              // Create spans for name and description
              const nameSpan = document.createElement('span');
              nameSpan.className = 'review-value-name';
              nameSpan.textContent = value;

              const descSpan = document.createElement('span');
              descSpan.className = 'review-value-description';
              descSpan.textContent = valueDefinitionsMap.get(value) || "(Description not found)";

              li.appendChild(nameSpan);
              li.appendChild(descSpan);
              list.appendChild(li);
            });
            section.appendChild(list);
          }
          
          grid.appendChild(section);
        });
        
        reviewContent.appendChild(grid);
        
        // Add the final statements
        const title = document.createElement("h3");
        title.textContent = "Your Core Values & Statements:";
        reviewContent.appendChild(title);
        const list = document.createElement("ul");
        const coreCards = this.state.cards.filter((c) => c.column === "core");
        coreCards.forEach((card) => {
          const li = document.createElement("li");
          const statement = this.state.finalStatements[card.id] || "(No statement written)";
          li.textContent = `${statement} (${card.name})`;
          list.appendChild(li);
        });
        reviewContent.appendChild(list);
      }
    }

    // -- Update toggle button appearance based on current state --
    const limitedBtn = document.getElementById("useLimitedValuesBtn") as HTMLButtonElement | null;
    const allBtn = document.getElementById("useAllValuesBtn") as HTMLButtonElement | null;
    if (limitedBtn) {
        limitedBtn.classList.toggle('active', this.state.valueSet === 'limited');
        limitedBtn.disabled = this.state.valueSet === 'limited'; // Disable active button
    }
    if (allBtn) {
        allBtn.classList.toggle('active', this.state.valueSet === 'all');
        allBtn.disabled = this.state.valueSet === 'all'; // Disable active button
    }
  }

  // Update the disabled state of the undo/redo buttons.
  private updateUndoRedoButtons() {
    const undoBtn = document.getElementById("undoBtn") as HTMLButtonElement;
    const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
    if (undoBtn) undoBtn.disabled = !this.undoManager.canUndo();
    if (redoBtn) redoBtn.disabled = !this.undoManager.canRedo();
  }
}

// Initialize the app normally, only if in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener("DOMContentLoaded", () => {
    new App();
  });
}
