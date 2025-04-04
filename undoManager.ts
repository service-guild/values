// A generic undo manager that stores state snapshots.
export class UndoManager<T> {
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
