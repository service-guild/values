import { UndoManager } from './undoManager';
import { VALUES } from './values';

// Custom Modal System
type AlertType = 'warning' | 'error' | 'success' | 'info';

interface ModalOptions {
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const ICONS: Record<AlertType, string> = {
  warning: '⚠',
  error: '✕',
  success: '✓',
  info: '!',
};

function showModal(options: ModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById('alertModal') as HTMLDivElement;
    const icon = document.getElementById('alertIcon') as HTMLDivElement;
    const title = document.getElementById('alertTitle') as HTMLHeadingElement;
    const message = document.getElementById('alertMessage') as HTMLParagraphElement;
    const confirmBtn = document.getElementById('alertConfirmBtn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('alertCancelBtn') as HTMLButtonElement;

    const type = options.type ?? 'info';

    // Set content
    icon.className = `alert-icon ${type}`;
    icon.textContent = ICONS[type];
    title.textContent = options.title;
    message.textContent = options.message;
    confirmBtn.textContent = options.confirmText ?? 'OK';
    cancelBtn.textContent = options.cancelText ?? 'Cancel';
    cancelBtn.style.display = options.showCancel ? 'inline-block' : 'none';

    // Show modal
    modal.style.display = 'flex';

    // Focus confirm button
    setTimeout(() => {
      confirmBtn.focus();
    }, 50);

    // Cleanup function
    const cleanup = () => {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKeydown);
    };

    const onConfirm = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const onBackdrop = (e: MouseEvent) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      } else if (e.key === 'Enter') {
        cleanup();
        resolve(true);
      }
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKeydown);
  });
}

// Convenience functions
function showAlert(title: string, message: string, type: AlertType = 'info'): Promise<boolean> {
  return showModal({ title, message, type });
}

function showConfirm(title: string, message: string, type: AlertType = 'warning'): Promise<boolean> {
  return showModal({ title, message, type, showCancel: true, confirmText: 'Yes', cancelText: 'No' });
}

// Define interfaces for our value cards and overall app state.
export interface ValueCard {
  id: number;
  name: string;
  column: string; // Part1: "unassigned", "notImportant", "important", "veryImportant"
  // Part2: same as Part1
  // Part3: "core" or "additional" (for cards carried over from veryImportant)
  order: number;
  description?: string; // Add optional description for custom cards
  isCustom?: boolean; // Flag for custom cards
}

export interface AppState {
  currentPart: 'part1' | 'part2' | 'part3' | 'part4' | 'review';
  cards: ValueCard[];
  // In part 4, user can add final statements for each core value (by card id)
  finalStatements: Record<number, string>;
  valueSet: 'limited' | 'all'; // Add state for current value set
  editingDescriptionCardId: number | null; // ID of card whose description is being edited
}

// Use type-only import

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
  ALL_VALUE_DEFINITIONS.map((def: ValueDefinition) => [def.name, def.description]),
);

// Main application class
export class App {
  private state: AppState;
  public undoManager: UndoManager<AppState>;
  private storageKey = 'valuesExerciseState';
  private nextCustomCardId = -1; // Counter for unique negative IDs
  private selectedCardId: number | null = null; // For mobile tap-to-move

  constructor() {
    // Load state from localStorage or initialize default state.
    const saved = localStorage.getItem(this.storageKey);
    let initialState: AppState;
    if (saved) {
      try {
        initialState = JSON.parse(saved) as AppState;
        // Ensure editing state is null initially
        initialState.editingDescriptionCardId = null;
        const minId = Math.min(0, ...initialState.cards.filter((c) => c.isCustom).map((c) => c.id));
        this.nextCustomCardId = minId - 1;
      } catch {
        initialState = this.defaultState('all');
        this.nextCustomCardId = -1; // Reset on error
      }
    } else {
      initialState = this.defaultState('all');
      this.nextCustomCardId = -1; // Reset if no saved state
    }
    this.state = initialState;
    this.undoManager = new UndoManager<AppState>(this.state);

    this.bindEventListeners();
    this.render();
    this.updateUndoRedoButtons();
  }

  // Default state with sample value cards based on the selected set
  public defaultState(valueSet: 'limited' | 'all' = 'all'): AppState {
    const definitionsToUse = valueSet === 'all' ? ALL_VALUE_DEFINITIONS : LIMITED_VALUE_DEFINITIONS;
    const sampleCards: ValueCard[] = definitionsToUse.map((definition: ValueDefinition, index: number) => ({
      id: index + 1,
      name: definition.name, // Use name from definition
      column: 'unassigned',
      order: index,
      description: undefined, // Ensure built-in cards start with no override
      isCustom: false,
    }));
    return {
      currentPart: 'part1',
      cards: sampleCards,
      finalStatements: {},
      valueSet: valueSet, // Store the set used
      editingDescriptionCardId: null, // Start with no editing
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

  // --- Add Value Form Logic ---
  public showAddValueForm() {
    const form = document.getElementById('addValueForm') as HTMLDivElement | null;
    const nameInput = document.getElementById('newValueName') as HTMLInputElement | null;
    const descInput = document.getElementById('newValueDesc') as HTMLTextAreaElement | null;
    if (form && nameInput && descInput) {
      nameInput.value = ''; // Clear previous input
      descInput.value = '';
      form.style.display = 'flex'; // Show the modal
      nameInput.focus(); // Focus the name input
    }
  }

  public hideAddValueForm() {
    const form = document.getElementById('addValueForm') as HTMLDivElement | null;
    if (form) {
      form.style.display = 'none'; // Hide the modal
    }
  }

  public async saveNewValue() {
    const nameInput = document.getElementById('newValueName') as HTMLInputElement | null;
    const descInput = document.getElementById('newValueDesc') as HTMLTextAreaElement | null;
    const name = nameInput?.value.trim().toUpperCase(); // Normalize name
    const description = descInput?.value.trim();

    if (!name) {
      await showAlert('Missing Name', 'Please enter a name for the new value.', 'warning');
      nameInput?.focus();
      return;
    }
    if (!description) {
      await showAlert('Missing Description', 'Please enter a description for the new value.', 'warning');
      descInput?.focus();
      return;
    }

    const newState = this.undoManager.getState();

    // Check for duplicates (case-insensitive)
    if (newState.cards.some((card) => card.name.toUpperCase() === name)) {
      await showAlert('Duplicate Value', `A value named "${name}" already exists.`, 'error');
      nameInput?.focus();
      return;
    }

    // Create new card
    const newCard: ValueCard = {
      id: this.nextCustomCardId,
      name: name,
      description: description, // Store description directly on card
      column: 'unassigned', // Add to unassigned in current view
      order: 0, // Will be set below
      isCustom: true,
    };

    this.nextCustomCardId--; // Decrement for next custom card

    // Add the new card
    newState.cards.push(newCard);

    // Sort only unassigned cards alphabetically, preserve order in other columns
    const unassignedCards = newState.cards.filter((c) => c.column === 'unassigned');
    unassignedCards.sort((a, b) => a.name.localeCompare(b.name));
    unassignedCards.forEach((card, index) => {
      card.order = index;
    });

    // Sort entire array so unassigned cards render in alphabetical order
    newState.cards.sort((a, b) => {
      if (a.column === 'unassigned' && b.column === 'unassigned') {
        return a.name.localeCompare(b.name);
      }
      return a.order - b.order;
    });

    this.updateState(newState);
    this.hideAddValueForm();
  }

  // --- Description Edit Logic ---
  public startEditingDescription(cardId: number) {
    const newState = this.undoManager.getState();
    newState.editingDescriptionCardId = cardId;
    this.updateState(newState); // Re-render to show the textarea
  }

  public saveDescriptionEdit(cardId: number, newDescription: string) {
    const newState = this.undoManager.getState();
    const cardToUpdate = newState.cards.find((c) => c.id === cardId);
    if (cardToUpdate) {
      cardToUpdate.description = newDescription.trim(); // Save trimmed description
    }
    newState.editingDescriptionCardId = null; // Stop editing
    this.updateState(newState);
  }

  public cancelDescriptionEdit() {
    const newState = this.undoManager.getState();
    newState.editingDescriptionCardId = null; // Just stop editing, don't save
    this.updateState(newState);
  }

  // Bind event listeners for UI interactions.
  private bindEventListeners() {
    // Remove alias: Arrow functions capture 'this' correctly
    // const appInstance = this;

    // --- Add Value Form Listeners ---
    document.getElementById('showAddValueFormBtn')?.addEventListener('click', () => {
      this.showAddValueForm();
    });
    document.getElementById('saveNewValueBtn')?.addEventListener('click', () => {
      void this.saveNewValue();
    });
    document.getElementById('cancelNewValueBtn')?.addEventListener('click', () => {
      this.hideAddValueForm();
    });
    // Close modal if clicking outside the content
    document.getElementById('addValueForm')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideAddValueForm();
      }
    });

    // Navigation buttons
    document.getElementById('toPart2')?.addEventListener('click', () => {
      void (async () => {
        const newState = this.undoManager.getState();
        // Check for unassigned cards before proceeding
        const unassignedCount = newState.cards.filter((card) => card.column === 'unassigned').length;
        if (unassignedCount > 0) {
          await showAlert(
            'Sort All Values',
            `Please sort all ${unassignedCount} unassigned value(s) before proceeding to Part 2.`,
            'warning',
          );
          return;
        }
        newState.currentPart = 'part2';
        newState.cards = newState.cards
          .filter((card) => card.column === 'veryImportant')
          .map((card) => ({ ...card, column: 'unassigned' }));
        this.updateState(newState); // Call updateState directly
      })();
    });
    document.getElementById('toPart3')?.addEventListener('click', () => {
      void (async () => {
        const newState = this.undoManager.getState();
        // Check for unassigned cards before proceeding
        const unassignedCount = newState.cards.filter((card) => card.column === 'unassigned').length;
        if (unassignedCount > 0) {
          await showAlert(
            'Sort All Values',
            `Please sort all ${unassignedCount} unassigned value(s) before proceeding.`,
            'warning',
          );
          return;
        }
        const veryImportantCards = newState.cards.filter((c) => c.column === 'veryImportant');
        const veryImportantCount = veryImportantCards.length;

        if (veryImportantCount <= 5) {
          newState.currentPart = 'part4';
        } else {
          newState.currentPart = 'part3';
        }
        // Move all "veryImportant" cards to "core" regardless of the next part
        newState.cards = veryImportantCards.map((c, idx) => ({ ...c, column: 'core', order: idx }));

        this.updateState(newState); // Call updateState directly
      })();
    });
    document.getElementById('toPart4')?.addEventListener('click', () => {
      void (async () => {
        const newState = this.undoManager.getState();
        const coreCount = newState.cards.filter((c) => c.column === 'core').length;
        if (coreCount > 5) {
          await showAlert(
            'Too Many Core Values',
            "You can only have 5 core values. Please move some values to 'Also Something I Want' before continuing.",
            'warning',
          );
          return; // Don't update state if validation fails
        }
        newState.currentPart = 'part4';
        this.updateState(newState); // Call updateState directly
      })();
    });
    document.getElementById('finish')?.addEventListener('click', () => {
      void (async () => {
        const newState = this.undoManager.getState();
        // Check if all core values have statements
        const coreCards = newState.cards.filter((c) => c.column === 'core');
        const missingStatements = coreCards.filter((card) => !newState.finalStatements[card.id]?.trim());

        if (missingStatements.length > 0) {
          await showAlert(
            'Missing Statements',
            `Please provide a statement for all core values. Missing: ${missingStatements.map((c) => c.name).join(', ')}`,
            'warning',
          );
          return; // Prevent transition
        }

        // Original transition logic
        newState.currentPart = 'review';
        this.updateState(newState); // Call updateState directly
      })();
    });
    document.getElementById('restart')?.addEventListener('click', () => {
      const newState = this.defaultState();
      this.updateState(newState); // Call updateState directly
    });

    // --- Triple-click on title to toggle testing mode button ---
    const titleElement = document.querySelector('header h1');
    let clickCount = 0;
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    titleElement?.addEventListener('click', () => {
      clickCount++;
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 500); // Reset after 500ms of no clicks

      if (clickCount >= 3) {
        clickCount = 0;
        const limitedBtn = document.getElementById('useLimitedValuesBtn') as HTMLButtonElement | null;
        if (limitedBtn) {
          const isHidden = limitedBtn.style.display === 'none';
          limitedBtn.style.display = isHidden ? 'inline-block' : 'none';
        }
      }
    });

    // --- Listener for the testing mode toggle button ---
    document.getElementById('useLimitedValuesBtn')?.addEventListener('click', () => {
      void (async () => {
        const currentSet = this.undoManager.getState().valueSet;
        if (currentSet !== 'limited') {
          const confirmed = await showConfirm(
            'Switch to Testing Mode',
            'Switching to testing mode (10 values) will reset your current progress. Are you sure?',
            'warning',
          );
          if (confirmed) {
            this.toggleValueSet();
          }
        } else {
          // Already in limited mode, switch back to all
          const confirmed = await showConfirm(
            'Switch to Full Mode',
            'Switching to full mode (all values) will reset your current progress. Are you sure?',
            'warning',
          );
          if (confirmed) {
            this.toggleValueSet();
          }
        }
      })();
    });

    // Undo/Redo buttons
    document.getElementById('undoBtn')?.addEventListener('click', () => {
      const prev = this.undoManager.undo();
      if (prev) {
        this.state = prev;
        this.saveState();
        this.render();
        this.updateUndoRedoButtons();
      }
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
      const next = this.undoManager.redo();
      if (next) {
        this.state = next;
        this.saveState();
        this.render();
        this.updateUndoRedoButtons();
      }
    });

    // Clear storage button (renamed to Restart exercise)
    document.getElementById('clearStorageBtn')?.addEventListener('click', () => {
      void (async () => {
        const confirmed = await showConfirm(
          'Restart Exercise',
          'Are you sure you want to restart? All progress will be lost. This action cannot be undone.',
          'error',
        );
        if (confirmed) {
          localStorage.removeItem(this.storageKey);
          // Reset to the default state using the *current* value set preference
          const newState = this.defaultState(this.state.valueSet);
          this.updateState(newState);
        }
      })();
    });

    // Set up drag and drop for card movement in all card-container elements.
    const containers = document.querySelectorAll('.card-container');
    containers.forEach((container) => {
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
      });
      container.addEventListener('dragleave', (e) => {
        // Only remove if we're leaving the container entirely
        const relatedTarget = (e as DragEvent).relatedTarget as Node | null;
        if (!container.contains(relatedTarget)) {
          container.classList.remove('drag-over');
        }
      });
      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        const dragEvent = e as DragEvent;
        const cardId = Number(dragEvent.dataTransfer?.getData('text/plain'));
        const targetColumn = container.parentElement!.getAttribute('data-column');
        if (targetColumn) {
          void this.moveCard(cardId, targetColumn);
        }
      });
      container.addEventListener('dragend', () => {
        // Clean up all drag-over states
        document.querySelectorAll('.card-container.drag-over').forEach((el) => {
          el.classList.remove('drag-over');
        });
      });

      // Mobile: click on container to move selected card
      container.addEventListener('click', (e) => {
        // Only handle if a card is selected and click is directly on container (not on a card)
        if (this.selectedCardId !== null && e.target === container) {
          const targetColumn = container.parentElement?.getAttribute('data-column');
          if (targetColumn) {
            void this.moveCard(this.selectedCardId, targetColumn);
            this.selectedCardId = null; // Clear selection after move
          }
        }
      });
    });
  }

  // Moves a card (by id) to a new column.
  private async moveCard(cardId: number, newColumn: string) {
    const newState = this.undoManager.getState();
    const card = newState.cards.find((c) => c.id === cardId);
    if (card) {
      // If in Part3 and moving to the 'core' column, enforce a maximum of 5 core cards.
      if (newState.currentPart === 'part3' && newColumn === 'core') {
        const coreCount = newState.cards.filter((c) => c.column === 'core').length;
        if (coreCount >= 5 && card.column !== 'core') {
          await showAlert('Limit Reached', 'You can only have 5 core values!', 'warning');
          return;
        }
      }
      card.column = newColumn;
      // Optionally, update order if needed (here we simply set order to current timestamp).
      card.order = Date.now();
      this.updateState(newState);
    }
  }

  // Creates a draggable card element, handles description editing UI.
  private createCardElement(card: ValueCard): HTMLElement {
    const cardElem = document.createElement('div');
    cardElem.className = 'card';
    cardElem.draggable = true;
    cardElem.dataset.cardId = card.id.toString();

    const nameElem = document.createElement('span');
    nameElem.className = 'card-name';
    nameElem.textContent = card.name;
    cardElem.appendChild(nameElem);

    // Container for description/edit area
    const descriptionContainer = document.createElement('div');
    descriptionContainer.className = 'card-description-container';

    if (this.state.editingDescriptionCardId === card.id) {
      // RENDER EDIT TEXTAREA
      const textarea = document.createElement('textarea');
      textarea.className = 'card-description-edit';
      textarea.value = card.description ?? valueDefinitionsMap.get(card.name) ?? '';
      textarea.rows = 3;

      textarea.addEventListener('blur', () => {
        this.saveDescriptionEdit(card.id, textarea.value);
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); // Prevent newline
          this.saveDescriptionEdit(card.id, textarea.value);
        } else if (e.key === 'Escape') {
          this.cancelDescriptionEdit();
        }
      });

      descriptionContainer.appendChild(textarea);
      // Auto-focus the textarea after it's rendered
      setTimeout(() => {
        textarea.focus();
      }, 0);
    } else {
      // RENDER DESCRIPTION TEXT (Clickable)
      const descriptionElem = document.createElement('span');
      descriptionElem.className = 'card-description clickable'; // Add clickable class
      descriptionElem.textContent =
        card.description ?? valueDefinitionsMap.get(card.name) ?? '(Click to add description)';
      descriptionElem.title = 'Click to edit description'; // Tooltip

      descriptionElem.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card drag start if clicking text
        this.toggleCardSelection(card.id); // Also select card to show drop zones
        this.startEditingDescription(card.id);
      });
      descriptionContainer.appendChild(descriptionElem);
    }

    cardElem.appendChild(descriptionContainer);

    cardElem.addEventListener('dragstart', (e) => {
      // Only allow drag if not editing description
      if (this.state.editingDescriptionCardId === null) {
        e.dataTransfer?.setData('text/plain', card.id.toString());
      } else {
        e.preventDefault(); // Prevent drag while editing
      }
    });

    // Mobile tap-to-select functionality
    cardElem.addEventListener('click', (e) => {
      // Don't trigger if clicking on description (for editing) - but still allow selection
      if ((e.target as HTMLElement).classList.contains('card-description')) {
        // Also select the card when tapping the description area
        this.toggleCardSelection(card.id);
        return;
      }
      this.toggleCardSelection(card.id);
    });

    // Add selected class if this card is selected
    if (this.selectedCardId === card.id) {
      cardElem.classList.add('selected');
    }

    return cardElem;
  }

  // Toggle card selection for mobile
  private toggleCardSelection(cardId: number) {
    if (this.selectedCardId === cardId) {
      // Deselect if already selected
      this.selectedCardId = null;
    } else {
      this.selectedCardId = cardId;
    }
    this.render();
  }

  // Render the UI based on the current state.
  private render() {
    // Manage tabindex for global controls based on current part
    const isPart4Active = this.state.currentPart === 'part4';
    const globalControls = document.querySelectorAll('#global-controls button');
    globalControls.forEach((btn) => {
      if (isPart4Active) {
        (btn as HTMLElement).tabIndex = -1; // Make header buttons non-tabbable during Part 4
      } else {
        (btn as HTMLElement).removeAttribute('tabindex'); // Restore default tabbability
      }
    });

    // Hide all parts first.
    document.querySelectorAll('.exercise-part').forEach((section) => {
      (section as HTMLElement).style.display = 'none';
    });
    // Show the current part.
    const partElem = document.getElementById(this.state.currentPart);
    if (partElem) {
      partElem.style.display = 'block';
    }
    // Render cards for the current part.
    if (this.state.currentPart === 'part1') {
      // Clear containers for Part 1
      [
        'part1-unassignedContainer',
        'part1-veryImportantContainer',
        'part1-importantContainer',
        'part1-notImportantContainer',
      ].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
      });
      // Render each card into its Part 1 container.
      this.state.cards.forEach((card) => {
        const containerId = 'part1-' + card.column + 'Container'; // Use Part 1 prefix
        const container = document.getElementById(containerId);
        if (container) {
          const cardElem = this.createCardElement(card); // Use helper
          container.appendChild(cardElem);
        }
      });
    } else if (this.state.currentPart === 'part2') {
      // Clear containers for Part 2
      [
        'part2-unassignedContainer',
        'part2-veryImportantContainer',
        'part2-importantContainer',
        'part2-notImportantContainer',
      ].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
      });

      // Log the state for debugging (can be removed later)
      // console.log("Rendering Part 2:", {
      //   totalCards: this.state.cards.length,
      //   cards: this.state.cards.map(c => ({ name: c.name, column: c.column }))
      // });

      // In Part 2, show all cards in their current Part 2 columns
      this.state.cards.forEach((card) => {
        const containerId = 'part2-' + card.column + 'Container'; // Use Part 2 prefix
        const container = document.getElementById(containerId);
        if (container) {
          const cardElem = this.createCardElement(card); // Use helper
          container.appendChild(cardElem);
        } else {
          // Log error if container not found (can be removed later)
          // console.error(`Container not found for card ${card.name} in column ${card.column}`);
        }
      });
    } else if (this.state.currentPart === 'part3') {
      // Clear containers for part3
      ['coreContainer', 'additionalContainer'].forEach((id) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = '';
      });
      this.state.cards.forEach((card) => {
        if (card.column === 'core' || card.column === 'additional') {
          const containerId = card.column + 'Container';
          const container = document.getElementById(containerId);
          if (container) {
            const cardElem = this.createCardElement(card); // Use helper
            container.appendChild(cardElem);
          }
        }
      });
    } else if (this.state.currentPart === 'part4') {
      // Render text inputs for each core value.
      const finalStatementsContainer = document.getElementById('finalStatements');
      if (finalStatementsContainer) {
        const coreCards = this.state.cards.filter((c) => c.column === 'core');
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
            const currentValue = this.state.finalStatements[cardId] ?? '';
            if (input.value !== currentValue) {
              input.value = currentValue;
            }
          });
        } else {
          // Inputs don't exist or don't match: Clear and recreate them
          finalStatementsContainer.innerHTML = '';
          coreCards.forEach((card) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'final-statement';
            const label = document.createElement('label');
            label.htmlFor = `statement-${card.id}`;
            label.textContent = `Describe what "${card.name}" means to you:`;
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `statement-${card.id}`;
            input.value = this.state.finalStatements[card.id] ?? '';
            // Use 'blur' event to update state directly when field loses focus
            input.addEventListener('blur', () => {
              const currentState = this.undoManager.getState(); // Get latest state
              // Avoid modifying the state if it hasn't actually changed
              if (currentState.finalStatements[card.id] !== input.value) {
                const newState = this.undoManager.getState(); // Get a fresh copy to modify
                newState.finalStatements[card.id] = input.value;
                this.updateState(newState); // Update authoritative state
              }
            });
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            finalStatementsContainer.appendChild(wrapper);
          });
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    else if (this.state.currentPart === 'review') {
      const reviewContent = document.getElementById('reviewContent');
      if (reviewContent) {
        reviewContent.innerHTML = '';

        // Add the visualization grid
        const grid = document.createElement('div');
        grid.className = 'values-grid';

        // Create sections for core values and additional values
        const categories = [
          { title: 'Core Values (F*CK YEAH)', column: 'core' },
          { title: 'Also Something I Want', column: 'additional' },
        ];

        categories.forEach((category) => {
          const section = document.createElement('div');
          section.className = 'grid-section';
          const title = document.createElement('h3');
          title.textContent = category.title;
          section.appendChild(title);

          // Get the actual card objects, not just names
          const cardsInCategory = this.state.cards.filter((c) => c.column === category.column);
          // Sort them alphabetically by name for consistent display
          cardsInCategory.sort((a, b) => a.name.localeCompare(b.name));

          if (cardsInCategory.length > 0) {
            const list = document.createElement('ul');
            // Iterate over the card objects
            cardsInCategory.forEach((card) => {
              const li = document.createElement('li');
              const nameSpan = document.createElement('span');
              nameSpan.className = 'review-value-name';
              nameSpan.textContent = card.name; // Use name from card object

              const descSpan = document.createElement('span');
              descSpan.className = 'review-value-description';
              // Prioritize card.description, fall back to map
              descSpan.textContent = card.description ?? valueDefinitionsMap.get(card.name) ?? '(Description missing)';

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
        const title = document.createElement('h3');
        title.textContent = 'Your Core Values & Statements:';
        reviewContent.appendChild(title);
        const list = document.createElement('ul');
        const coreCards = this.state.cards.filter((c) => c.column === 'core');
        coreCards.forEach((card) => {
          const li = document.createElement('li');
          const statement = this.state.finalStatements[card.id] ?? '(No statement written)';
          li.textContent = `${statement} (${card.name})`;
          list.appendChild(li);
        });
        reviewContent.appendChild(list);
      }
    }

    // Update visual state for mobile selection
    const allContainers = document.querySelectorAll('.card-container');
    allContainers.forEach((container) => {
      if (this.selectedCardId !== null) {
        container.classList.add('can-receive');
      } else {
        container.classList.remove('can-receive');
      }
    });

    // Update progress stepper
    this.updateProgressStepper();

    // -- Update toggle button appearance based on current state --
    const limitedBtn = document.getElementById('useLimitedValuesBtn') as HTMLButtonElement | null;
    if (limitedBtn) {
      // Update button text to reflect current mode
      if (this.state.valueSet === 'limited') {
        limitedBtn.textContent = 'Use All Values';
        limitedBtn.classList.add('active');
      } else {
        limitedBtn.textContent = 'Use 10 Values';
        limitedBtn.classList.remove('active');
      }
    }
  }

  // Update the disabled state of the undo/redo buttons.
  private updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (undoBtn) undoBtn.disabled = !this.undoManager.canUndo();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (redoBtn) redoBtn.disabled = !this.undoManager.canRedo();
  }

  // Update the progress stepper UI
  private updateProgressStepper() {
    const steps = ['part1', 'part2', 'part3', 'part4', 'review'];
    const currentIndex = steps.indexOf(this.state.currentPart);

    const stepElements = document.querySelectorAll('.step');
    const connectors = document.querySelectorAll('.step-connector');

    stepElements.forEach((stepEl, index) => {
      stepEl.classList.remove('active', 'completed');
      if (index === currentIndex) {
        stepEl.classList.add('active');
      } else if (index < currentIndex) {
        stepEl.classList.add('completed');
      }
    });

    connectors.forEach((connector, index) => {
      connector.classList.remove('completed');
      if (index < currentIndex) {
        connector.classList.add('completed');
      }
    });
  }
}

// Initialize the app normally, only if in a browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    new App();
  });
}
