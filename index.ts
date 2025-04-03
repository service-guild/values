// Define interfaces for our value cards and overall app state.
interface ValueCard {
  id: number;
  name: string;
  column: string; // Part1: "unassigned", "notImportant", "important", "veryImportant"
  // Part2: same as Part1
  // Part3: "core" or "additional" (for cards carried over from veryImportant)
  order: number;
}

interface AppState {
  currentPart: "part1" | "part2" | "part3" | "part4" | "review";
  cards: ValueCard[];
  // In part 4, user can add final statements for each core value (by card id)
  finalStatements: { [cardId: number]: string };
}

// A generic undo manager that stores state snapshots.
class UndoManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private currentState: T;
  constructor(initialState: T) {
    this.currentState = this.deepCopy(initialState);
  }
  private deepCopy(state: T): T {
    return JSON.parse(JSON.stringify(state));
  }
  execute(newState: T) {
    this.undoStack.push(this.deepCopy(this.currentState));
    this.currentState = this.deepCopy(newState);
    this.redoStack = []; // clear redo on new action
  }
  undo(): T | null {
    if (!this.undoStack.length) return null;
    this.redoStack.push(this.deepCopy(this.currentState));
    this.currentState = this.undoStack.pop()!;
    return this.deepCopy(this.currentState);
  }
  redo(): T | null {
    if (!this.redoStack.length) return null;
    this.undoStack.push(this.deepCopy(this.currentState));
    this.currentState = this.redoStack.pop()!;
    return this.deepCopy(this.currentState);
  }
  getState(): T {
    return this.deepCopy(this.currentState);
  }
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}

// Main application class
class App {
  private state: AppState;
  private undoManager: UndoManager<AppState>;
  private storageKey: string = "valuesExerciseState";

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
    this.bindEventListeners();
    this.render();
    this.updateUndoRedoButtons();
  }

  // Default state with some sample value cards.
  // Replace the defaultState() function with the following code:

  private defaultState(): AppState {
    const values = [
      "ACCEPTANCE",
      "ACCURACY",
      "ACHIEVEMENT",
      "ADVENTURE",
      "ATTRACTIVENESS",
      "AUTHORITY",
      "AUTONOMY",
      "BEAUTY",
      "CARING",
      "CHALLENGE",
      "CHANGE",
      "COMFORT",
      // "COMMITMENT",
      // "COMPASSION",
      // "CONTRIBUTION",
      // "COOPERATION",
      // "COURTESY",
      // "CREATIVITY",
      // "DEPENDABILITY",
      // "DUTY",
      // "ECOLOGY",
      // "EXCITEMENT",
      // "FAITHFULNESS",
      // "FAME",
      // "FAMILY",
      // "FITNESS",
      // "FLEXIBILITY",
      // "FORGIVENESS",
      // "FRIENDSHIP",
      // "FUN",
      // "GENEROSITY",
      // "GENUINENESS",
      // "GOD'S WILL",
      // "GROWTH",
      // "HEALTH",
      // "HELPFULNESS",
      // "HONESTY",
      // "HOPE",
      // "HUMILITY",
      // "HUMOR",
      // "INDEPENDENCE",
      // "INDUSTRY",
      // "INNER PEACE",
      // "INTIMACY",
      // "JUSTICE",
      // "KNOWLEDGE",
      // "LEISURE",
      // "LOVED",
      // "LOVING",
      // "MASTERY",
      // "MINDFULNESS",
      // "MODERATION",
      // "MONOGAMY",
      // "NONCONFORMITY",
      // "NURTURANCE",
      // "OPENNESS",
      // "ORDER",
      // "PASSION",
      // "PLEASURE",
      // "POPULARITY",
      // "POWER",
      // "PURPOSE",
      // "RATIONALITY",
      // "REALISM",
      // "RESPONSIBILITY",
      // "RISK",
      // "ROMANCE",
      // "SAFETY",
      // "SELF-ACCEPTANCE",
      // "SELF-CONTROL",
      // "SELF-ESTEEM",
      // "SELF-KNOWLEDGE",
      // "SERVICE",
      // "SEXUALITY",
      // "SIMPLICITY",
      // "SOLITUDE",
      // "SPIRITUALITY",
      // "STABILITY",
      // "TOLERANCE",
      // "TRADITION",
      // "VIRTUE",
      // "WEALTH",
      // "WORLD PEACE",
    ];
    const sampleCards: ValueCard[] = values.map((name, index) => ({
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
  private updateState(newState: AppState) {
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
      // In Part2, we only keep the "veryImportant" cards and move them to "unassigned"
      newState.cards = newState.cards
        .filter((c) => c.column === "veryImportant")
        .map((c) => ({ ...c, column: "unassigned" }));
      this.updateState(newState);
    });
    document.getElementById("backToPart1")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part1";
      // Restore Part1: move cards back to their original positions
      newState.cards.forEach((c) => {
        if (c.column === "unassigned") {
          c.column = "veryImportant";
        }
      });
      this.updateState(newState);
    });
    document.getElementById("toPart3")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      const veryImportantCount = newState.cards.filter((c) => c.column === "veryImportant").length;
      if (veryImportantCount <= 5) {
        // If 5 or fewer values in "Very important to me", skip to Part 4
        newState.currentPart = "part4";
        // Move all "veryImportant" cards to "core"
        newState.cards = newState.cards
          .filter((c) => c.column === "veryImportant")
          .map((c, idx) => ({ ...c, column: "core", order: idx }));
      } else {
        // Otherwise, proceed to Part 3
        newState.currentPart = "part3";
        // Move all "veryImportant" cards to "core"
        newState.cards = newState.cards
          .filter((c) => c.column === "veryImportant")
          .map((c, idx) => ({ ...c, column: "core", order: idx }));
      }
      this.updateState(newState);
    });
    document.getElementById("backToPart2")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part2";
      // Restore Part2: move cards back to their original positions
      newState.cards.forEach((c) => {
        if (c.column === "core" || c.column === "additional") {
          c.column = "veryImportant";
        }
      });
      this.updateState(newState);
    });
    document.getElementById("toPart4")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      const coreCount = newState.cards.filter((c) => c.column === "core").length;
      if (coreCount > 5) {
        alert("You can only have 5 core values! Please move some values to 'Also Something I Want' before continuing.");
        return;
      }
      newState.currentPart = "part4";
      this.updateState(newState);
    });
    document.getElementById("backToPart3")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "part3";
      this.updateState(newState);
    });
    document.getElementById("finish")?.addEventListener("click", () => {
      const newState = this.undoManager.getState();
      newState.currentPart = "review";
      this.updateState(newState);
    });
    document.getElementById("restart")?.addEventListener("click", () => {
      const newState = this.defaultState();
      this.updateState(newState);
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
      // If in Part2 and moving to core, enforce a maximum of 5 core cards.
      if (newState.currentPart === "part2" && newColumn === "core") {
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

  // Render the UI based on the current state.
  private render() {
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
    if (this.state.currentPart === "part1" || this.state.currentPart === "part2") {
      // Clear containers
      [
        "unassignedContainer",
        "veryImportantContainer",
        "importantContainer",
        "notImportantContainer",
      ].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = "";
      });
      // Render each card into its container.
      this.state.cards.forEach((card) => {
        const containerId = card.column + "Container";
        const container = document.getElementById(containerId);
        if (container) {
          const cardElem = document.createElement("div");
          cardElem.className = "card";
          cardElem.draggable = true;
          cardElem.textContent = card.name;
          cardElem.dataset.cardId = card.id.toString();
          cardElem.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", card.id.toString());
          });
          container.appendChild(cardElem);
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
            const cardElem = document.createElement("div");
            cardElem.className = "card";
            cardElem.draggable = true;
            cardElem.textContent = card.name;
            cardElem.dataset.cardId = card.id.toString();
            cardElem.addEventListener("dragstart", (e) => {
              e.dataTransfer?.setData("text/plain", card.id.toString());
            });
            container.appendChild(cardElem);
          }
        }
      });
    } else if (this.state.currentPart === "part4") {
      // Render text inputs for each core value.
      const finalStatements = document.getElementById("finalStatements");
      if (finalStatements) {
        finalStatements.innerHTML = "";
        const coreCards = this.state.cards.filter((c) => c.column === "core");
        coreCards.forEach((card) => {
          const wrapper = document.createElement("div");
          wrapper.className = "final-statement";
          const label = document.createElement("label");
          label.textContent = `I want ${card.name}: `;
          const input = document.createElement("input");
          input.type = "text";
          input.value = this.state.finalStatements[card.id] || "";
          input.addEventListener("change", () => {
            const newState = this.undoManager.getState();
            newState.finalStatements[card.id] = input.value;
            this.updateState(newState);
          });
          wrapper.appendChild(label);
          wrapper.appendChild(input);
          finalStatements.appendChild(wrapper);
        });
      }
    } else if (this.state.currentPart === "review") {
      const reviewContent = document.getElementById("reviewContent");
      if (reviewContent) {
        reviewContent.innerHTML = "";
        
        // Add the visualization grid
        const grid = document.createElement("div");
        grid.className = "values-grid";
        
        // Create sections for each category
        const categories = [
          { title: "Core Values (F*CK YEAH)", column: "core" },
          { title: "Important To Me", column: "important" },
          { title: "Very Important To Me", column: "veryImportant" },
          { title: "Not Important To Me", column: "notImportant" }
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
          const statement = this.state.finalStatements[card.id] || "";
          li.textContent = `${card.name}: ${statement}`;
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

// ----------------------
// Minimal Test Suite (TDD style)
// ----------------------
function runTests() {
  let testCount = 0;
  let passedCount = 0;
  function assert(condition: boolean, message: string) {
    testCount++;
    if (!condition) {
      console.error("Test failed:", message);
    } else {
      passedCount++;
    }
  }

  // Test UndoManager
  const initialState = { value: 1 };
  const um = new UndoManager(initialState);
  let state = um.getState();
  assert(state.value === 1, "Initial state should be 1");

  // Execute a change.
  um.execute({ value: 2 });
  state = um.getState();
  assert(state.value === 2, "State should update to 2");

  // Undo should bring back 1.
  const undone = um.undo();
  assert(
    undone !== null && undone.value === 1,
    "Undo should revert to state 1"
  );

  // Redo should bring state to 2.
  const redone = um.redo();
  assert(
    redone !== null && redone.value === 2,
    "Redo should set state back to 2"
  );

  // Test endless undo/redo by executing multiple changes.
  um.execute({ value: 3 });
  um.execute({ value: 4 });
  assert(um.getState().value === 4, "State should now be 4");
  um.undo();
  assert(um.getState().value === 3, "Undo should revert to 3");
  um.undo();
  assert(um.getState().value === 2, "Undo should revert to 2");
  um.redo();
  assert(um.getState().value === 3, "Redo should bring state to 3");

  console.log(`Tests passed: ${passedCount}/${testCount}`);
}

// Run tests if URL contains ?test=1
if (window.location.search.includes("test=1")) {
  runTests();
} else {
  // Initialize the app normally.
  window.addEventListener("DOMContentLoaded", () => {
    new App();
  });
}
