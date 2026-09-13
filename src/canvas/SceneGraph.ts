import type { BoardObject } from '../core/BoardObject'
import { registry } from '../core/Registry'

export class SceneGraph {
  private objects: BoardObject[] = []
  private selectedIds: Set<string> = new Set()
  private listeners: Array<() => void> = []

  public getObjects(): BoardObject[] {
    return this.objects
  }

  public getSelectedObjects(): BoardObject[] {
    return this.objects.filter((obj) => this.selectedIds.has(obj.id))
  }

  public getSelectedIds(): Set<string> {
    return this.selectedIds
  }

  public addObject(obj: BoardObject): void {
    this.objects.push(obj)
    this.notify()
  }

  public removeObject(id: string): BoardObject | undefined {
    const index = this.objects.findIndex((o) => o.id === id)
    if (index !== -1) {
      const [removed] = this.objects.splice(index, 1)
      this.selectedIds.delete(id)
      this.notify()
      return removed
    }
    return undefined
  }

  public updateObject(obj: BoardObject): void {
    const index = this.objects.findIndex((o) => o.id === obj.id)
    if (index !== -1) {
      this.objects[index] = obj
      this.notify()
    }
  }

  public clear(): void {
    this.objects = []
    this.selectedIds.clear()
    this.notify()
  }

  public select(id: string, multi: boolean = false): void {
    if (!multi) {
      this.selectedIds.clear()
    }
    this.selectedIds.add(id)
    this.notify()
  }

  public deselect(id: string): void {
    this.selectedIds.delete(id)
    this.notify()
  }

  public clearSelection(): void {
    this.selectedIds.clear()
    this.notify()
  }

  public hitTest(worldX: number, worldY: number): BoardObject | undefined {
    // Search top-to-bottom (reverse z-index)
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i]
      if (this.isHit(obj, worldX, worldY)) {
        return obj
      }
    }
    return undefined
  }

  public isHit(obj: BoardObject, worldX: number, worldY: number): boolean {
    const customRenderer = registry.getRenderer(obj.type)
    if (customRenderer) {
      return customRenderer.hitTest(obj, worldX, worldY)
    }

    const bounds = this.getObjectBounds(obj)
    const padding = Math.max(8, (obj.strokeWidth || 2) / 2)

    return (
      worldX >= bounds.x - padding &&
      worldX <= bounds.x + bounds.width + padding &&
      worldY >= bounds.y - padding &&
      worldY <= bounds.y + bounds.height + padding
    )
  }

  public getObjectBounds(obj: BoardObject): { x: number; y: number; width: number; height: number } {
    const customRenderer = registry.getRenderer(obj.type)
    if (customRenderer) {
      return customRenderer.getBounds(obj)
    }

    switch (obj.type) {
      case 'freehand': {
        const points = obj.points || []
        if (points.length === 0) return { x: obj.x, y: obj.y, width: 0, height: 0 }
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity
        for (const p of points) {
          if (p.x < minX) minX = p.x
          if (p.y < minY) minY = p.y
          if (p.x > maxX) maxX = p.x
          if (p.y > maxY) maxY = p.y
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
      }
      case 'rectangle':
      case 'text':
        return {
          x: obj.x,
          y: obj.y,
          width: obj.width || 100,
          height: obj.height || 60,
        }
      case 'circle': {
        const r = obj.radius || 40
        return {
          x: obj.x - r,
          y: obj.y - r,
          width: r * 2,
          height: r * 2,
        }
      }
      case 'line':
      case 'arrow': {
        const x2 = obj.x2 ?? obj.x
        const y2 = obj.y2 ?? obj.y
        const minX = Math.min(obj.x, x2)
        const minY = Math.min(obj.y, y2)
        const maxX = Math.max(obj.x, x2)
        const maxY = Math.max(obj.y, y2)
        return {
          x: minX,
          y: minY,
          width: Math.max(1, maxX - minX),
          height: Math.max(1, maxY - minY),
        }
      }
      default:
        return {
          x: obj.x,
          y: obj.y,
          width: obj.width || 50,
          height: obj.height || 50,
        }
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l())
  }
}
