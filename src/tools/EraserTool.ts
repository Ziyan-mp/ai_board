import type { BaseTool, ToolContext } from './BaseTool'
import type { ToolType } from './ToolType'

export class EraserTool implements BaseTool {
  public readonly name: ToolType = 'eraser'
  private isErasing: boolean = false

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return
    this.isErasing = true
    this.eraseAtPoint(event.offsetX, event.offsetY, context)
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isErasing) return
    this.eraseAtPoint(event.offsetX, event.offsetY, context)
  }

  public onPointerUp(_event: PointerEvent, _context: ToolContext): void {
    this.isErasing = false
  }

  private eraseAtPoint(screenX: number, screenY: number, context: ToolContext): void {
    const worldPoint = context.viewport.screenToWorld(screenX, screenY)
    const hit = context.sceneGraph.hitTest(worldPoint.x, worldPoint.y)

    if (hit) {
      const removed = context.sceneGraph.removeObject(hit.id)
      if (removed) {
        context.history.record({ type: 'DELETE', object: removed })
        context.requestRender()
      }
    }
  }
}
