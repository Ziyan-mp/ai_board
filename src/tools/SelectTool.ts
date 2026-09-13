import type { BaseTool, ToolContext } from './BaseTool'
import type { BoardObject, Point } from '../core/BoardObject'
import type { ToolType } from './ToolType'

export class SelectTool implements BaseTool {
  public readonly name: ToolType = 'select'
  private isDragging: boolean = false
  private dragStartWorld: Point | null = null
  private objectStartStates: Map<string, BoardObject> = new Map()

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return

    const worldPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const hitObject = context.sceneGraph.hitTest(worldPoint.x, worldPoint.y)

    if (hitObject) {
      context.sceneGraph.select(hitObject.id, event.shiftKey)
      this.isDragging = true
      this.dragStartWorld = worldPoint
      this.objectStartStates.clear()

      for (const selected of context.sceneGraph.getSelectedObjects()) {
        this.objectStartStates.set(selected.id, JSON.parse(JSON.stringify(selected)))
      }
    } else {
      context.sceneGraph.clearSelection()
      this.isDragging = false
      this.dragStartWorld = null
    }

    context.requestRender()
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDragging || !this.dragStartWorld) return

    const currentWorld = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const dx = currentWorld.x - this.dragStartWorld.x
    const dy = currentWorld.y - this.dragStartWorld.y

    const selectedObjects = context.sceneGraph.getSelectedObjects()
    for (const obj of selectedObjects) {
      const initial = this.objectStartStates.get(obj.id)
      if (!initial) continue

      if (obj.type === 'freehand' && initial.points) {
        obj.points = initial.points.map((p: Point) => ({ x: p.x + dx, y: p.y + dy }))
        obj.x = initial.x + dx
        obj.y = initial.y + dy
      } else if ((obj.type === 'line' || obj.type === 'arrow') && initial.x2 !== undefined) {
        obj.x = initial.x + dx
        obj.y = initial.y + dy
        obj.x2 = initial.x2 + dx
        obj.y2 = initial.y2 + dy
      } else {
        obj.x = initial.x + dx
        obj.y = initial.y + dy
      }

      context.sceneGraph.updateObject(obj)
    }

    context.requestRender()
  }

  public onPointerUp(_event: PointerEvent, context: ToolContext): void {
    if (this.isDragging && this.dragStartWorld) {
      const selectedObjects = context.sceneGraph.getSelectedObjects()
      const batchActions = []

      for (const obj of selectedObjects) {
        const initial = this.objectStartStates.get(obj.id)
        if (initial && (initial.x !== obj.x || initial.y !== obj.y)) {
          batchActions.push({
            type: 'UPDATE' as const,
            before: initial,
            after: JSON.parse(JSON.stringify(obj)),
          })
        }
      }

      if (batchActions.length === 1) {
        context.history.record(batchActions[0])
      } else if (batchActions.length > 1) {
        context.history.record({ type: 'BATCH', actions: batchActions })
      }
    }

    this.isDragging = false
    this.dragStartWorld = null
    this.objectStartStates.clear()
    context.requestRender()
  }
}
