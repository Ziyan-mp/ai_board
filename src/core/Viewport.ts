import type { Point } from './BoardObject'

export class Viewport {
  public x: number = 0
  public y: number = 0
  public zoom: number = 1.0

  public minZoom: number = 0.1
  public maxZoom: number = 5.0

  private listeners: Array<() => void> = []

  constructor(x: number = 0, y: number = 0, zoom: number = 1.0) {
    this.x = x
    this.y = y
    this.zoom = zoom
  }

  public screenToWorld(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.x) / this.zoom,
      y: (screenY - this.y) / this.zoom,
    }
  }

  public worldToScreen(worldX: number, worldY: number): Point {
    return {
      x: worldX * this.zoom + this.x,
      y: worldY * this.zoom + this.y,
    }
  }

  public pan(dx: number, dy: number): void {
    this.x += dx
    this.y += dy
    this.notify()
  }

  public setZoom(newZoom: number, focusScreenX?: number, focusScreenY?: number): void {
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
    if (clampedZoom === this.zoom) return

    if (focusScreenX !== undefined && focusScreenY !== undefined) {
      const worldBefore = this.screenToWorld(focusScreenX, focusScreenY)
      this.zoom = clampedZoom
      const worldAfter = this.screenToWorld(focusScreenX, focusScreenY)
      this.x += (worldAfter.x - worldBefore.x) * this.zoom
      this.y += (worldAfter.y - worldBefore.y) * this.zoom
    } else {
      this.zoom = clampedZoom
    }

    this.notify()
  }

  public reset(): void {
    this.x = 0
    this.y = 0
    this.zoom = 1.0
    this.notify()
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
