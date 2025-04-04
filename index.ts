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
}

// Import the UndoManager from its own file
import { UndoManager } from './undoManager';
// Import the default values from its own file
import { DEFAULT_VALUES } from './values';
import { debounce } from 'lodash'; // Import debounce from lodash

// Main application class
export class App {
  private state: AppState;
  public undoManager: UndoManager<AppState>;
  private storageKey: string = "valuesExerciseState";
  // Re-add the property to hold the debounced function
  private debouncedUpdateFinalStatement: (cardId: number, value: string) => void;

  constructor() {
    // Load state from localStorage or initialize default state.
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.state = JSON.parse(saved) as AppState;
      } catch {
        this.state = this.defaultState();
      }
    } else {
      this.state = this.defaultState();
    }
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

  // Default state with some sample value cards.
  public defaultState(): AppState {
    const sampleCards: ValueCard[] = DEFAULT_VALUES.map((name, index) => ({
      id: index + 1,
      name,
      column: "unassigned",
      order: index,
    }));
    return {
      currentPart: "part1",
      cards: sampleCards,
      finalStatements: {},
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

  // Bind event listeners for UI interactions.
  private bindEventListeners() {
    // Navigation buttons
    document.getElementById("toPart2")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part2";
      // Filter and map cards in one step
      newState.cards = newState.cards
        .filter(card => card.column === "veryImportant")
        .map(card => ({ ...card, column: "unassigned" }));
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("backToPart1")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part1";
      // Restore Part1: move cards back to their original positions
      // This logic seems potentially flawed - if a card started in 'important' but moved to 'unassigned' in part 2,
      // this moves it to 'veryImportant'. Revisiting Part 1 might require storing original Part 1 state.
      // For now, keeping the existing logic.
      newState.cards.forEach((c) => {
        if (c.column === "unassigned") {
          c.column = "veryImportant";
        }
      });
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("toPart3")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
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
    document.getElementById("backToPart2")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part2";
      // Restore Part2: move cards back to their original positions
      newState.cards.forEach((c) => {
        // This assumes cards in Part 3 only came from 'veryImportant' in Part 2
        if (c.column === "core" || c.column === "additional") {
          c.column = "veryImportant";
        }
      });
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
    document.getElementById("backToPart3")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part3";
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("finish")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "review";
      this.updateState(newState); // Call updateState directly
    });
    document.getElementById("restart")?.addEventListener("click", () => {
      const newState = this.defaultState();
      this.updateState(newState); // Call updateState directly
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

    // Clear storage button
    document.getElementById("clearStorageBtn")?.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all saved data? This action cannot be undone.")) {
        localStorage.removeItem(this.storageKey);
        const newState = this.defaultState();
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

  // Creates a draggable card element.
  private createCardElement(card: ValueCard): HTMLElement {
    const cardElem = document.createElement("div");
    cardElem.className = "card";
    cardElem.draggable = true;
    cardElem.textContent = card.name;
    cardElem.dataset.cardId = card.id.toString();
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
            .map(c => c.name);
          
          if (values.length > 0) {
            const list = document.createElement("ul");
            values.forEach(value => {
              const li = document.createElement("li");
              li.textContent = value;
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
