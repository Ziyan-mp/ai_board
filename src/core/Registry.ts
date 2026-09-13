import type { BoardObject } from './BoardObject'
import type { Viewport } from './Viewport'

export interface ObjectRenderer {
  render(ctx: CanvasRenderingContext2D, object: BoardObject, viewport: Viewport): void
  getBounds(object: BoardObject): { x: number; y: number; width: number; height: number }
  hitTest(object: BoardObject, worldX: number, worldY: number): boolean
}

class ExtensionRegistry {
  private renderers: Map<string, ObjectRenderer> = new Map()

  public registerRenderer(type: string, renderer: ObjectRenderer): void {
    this.renderers.set(type, renderer)
  }

  public getRenderer(type: string): ObjectRenderer | undefined {
    return this.renderers.get(type)
  }

  public hasRenderer(type: string): boolean {
    return this.renderers.has(type)
  }
}

export const registry = new ExtensionRegistry()
