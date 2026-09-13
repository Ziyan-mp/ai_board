import type { BaseTool, ToolContext } from './BaseTool'
import type { FreehandObject, Point } from '../core/BoardObject'
import type { ToolType } from './ToolType'

export class PenTool implements BaseTool {
  public readonly name: ToolType = 'pen'
  private isDrawing: boolean = false
  private currentPoints: Point[] = []
  private strokeColor: string = '#000000'
  private strokeWidth: number = 2

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return

    this.isDrawing = true
    const worldPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    this.currentPoints = [worldPoint]
    this.strokeColor = context.currentColor
    this.strokeWidth = context.currentWidth

    const preview: FreehandObject = {
      id: 'preview',
      type: 'freehand',
      x: worldPoint.x,
      y: worldPoint.y,
      points: [...this.currentPoints],
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing) return

    const worldPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    this.currentPoints.push(worldPoint)

    const preview: FreehandObject = {
      id: 'preview',
      type: 'freehand',
      x: this.currentPoints[0].x,
      y: this.currentPoints[0].y,
      points: [...this.currentPoints],
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerUp(_event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing) return
    this.isDrawing = false

    if (this.currentPoints.length > 1) {
      const newObj: FreehandObject = {
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'freehand',
        x: this.currentPoints[0].x,
        y: this.currentPoints[0].y,
        points: [...this.currentPoints],
        strokeColor: this.strokeColor,
        strokeWidth: this.strokeWidth,
      }

      context.sceneGraph.addObject(newObj)
      context.history.record({ type: 'ADD', object: newObj })
    }

    this.currentPoints = []
    context.setPreviewObject(null)
    context.requestRender()
  }
}
