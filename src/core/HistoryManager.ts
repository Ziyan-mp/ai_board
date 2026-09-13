import type { BoardObject } from './BoardObject'

export type HistoryAction =
  | { type: 'ADD'; object: BoardObject }
  | { type: 'DELETE'; object: BoardObject }
  | { type: 'UPDATE'; before: BoardObject; after: BoardObject }
  | { type: 'BATCH'; actions: HistoryAction[] }

export class HistoryManager {
  private undoStack: HistoryAction[] = []
  private redoStack: HistoryAction[] = []
  private listeners: Array<() => void> = []

  private applyCallback?: (action: HistoryAction, isUndo: boolean) => void

  public setApplyCallback(cb: (action: HistoryAction, isUndo: boolean) => void): void {
    this.applyCallback = cb
  }

  public record(action: HistoryAction): void {
    this.undoStack.push(action)
    this.redoStack = []
    this.notify()
  }

  public undo(): void {
    const action = this.undoStack.pop()
    if (!action) return

    this.redoStack.push(action)
    if (this.applyCallback) {
      this.applyCallback(action, true)
    }
    this.notify()
  }

  public redo(): void {
    const action = this.redoStack.pop()
    if (!action) return

    this.undoStack.push(action)
    if (this.applyCallback) {
      this.applyCallback(action, false)
    }
    this.notify()
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener())
  }
}
