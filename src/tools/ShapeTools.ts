import type { BaseTool, ToolContext } from './BaseTool'
import type { RectangleObject, CircleObject, LineObject, ArrowObject, Point } from '../core/BoardObject'
import type { ToolType } from './ToolType'

export class RectangleTool implements BaseTool {
  public readonly name: ToolType = 'rectangle'
  private isDrawing: boolean = false
  private startPoint: Point | null = null

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return
    this.isDrawing = true
    this.startPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const x = Math.min(this.startPoint.x, current.x)
    const y = Math.min(this.startPoint.y, current.y)
    const width = Math.abs(current.x - this.startPoint.x)
    const height = Math.abs(current.y - this.startPoint.y)

    const preview: RectangleObject = {
      id: 'preview',
      type: 'rectangle',
      x,
      y,
      width,
      height,
      strokeColor: context.currentColor,
      strokeWidth: context.currentWidth,
      fillColor: context.currentFill,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerUp(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return
    this.isDrawing = false

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const x = Math.min(this.startPoint.x, current.x)
    const y = Math.min(this.startPoint.y, current.y)
    const width = Math.abs(current.x - this.startPoint.x)
    const height = Math.abs(current.y - this.startPoint.y)

    if (width > 3 || height > 3) {
      const newObj: RectangleObject = {
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'rectangle',
        x,
        y,
        width,
        height,
        strokeColor: context.currentColor,
        strokeWidth: context.currentWidth,
        fillColor: context.currentFill,
      }
      context.sceneGraph.addObject(newObj)
      context.history.record({ type: 'ADD', object: newObj })
    }

    this.startPoint = null
    context.setPreviewObject(null)
    context.requestRender()
  }
}

export class CircleTool implements BaseTool {
  public readonly name: ToolType = 'circle'
  private isDrawing: boolean = false
  private startPoint: Point | null = null

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return
    this.isDrawing = true
    this.startPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const radius = Math.hypot(current.x - this.startPoint.x, current.y - this.startPoint.y)

    const preview: CircleObject = {
      id: 'preview',
      type: 'circle',
      x: this.startPoint.x,
      y: this.startPoint.y,
      radius,
      strokeColor: context.currentColor,
      strokeWidth: context.currentWidth,
      fillColor: context.currentFill,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerUp(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return
    this.isDrawing = false

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const radius = Math.hypot(current.x - this.startPoint.x, current.y - this.startPoint.y)

    if (radius > 3) {
      const newObj: CircleObject = {
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'circle',
        x: this.startPoint.x,
        y: this.startPoint.y,
        radius,
        strokeColor: context.currentColor,
        strokeWidth: context.currentWidth,
        fillColor: context.currentFill,
      }
      context.sceneGraph.addObject(newObj)
      context.history.record({ type: 'ADD', object: newObj })
    }

    this.startPoint = null
    context.setPreviewObject(null)
    context.requestRender()
  }
}

export class LineTool implements BaseTool {
  public readonly name: ToolType = 'line'
  private isDrawing: boolean = false
  private startPoint: Point | null = null

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return
    this.isDrawing = true
    this.startPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)

    const preview: LineObject = {
      id: 'preview',
      type: 'line',
      x: this.startPoint.x,
      y: this.startPoint.y,
      x2: current.x,
      y2: current.y,
      strokeColor: context.currentColor,
      strokeWidth: context.currentWidth,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerUp(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return
    this.isDrawing = false

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const dist = Math.hypot(current.x - this.startPoint.x, current.y - this.startPoint.y)

    if (dist > 3) {
      const newObj: LineObject = {
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'line',
        x: this.startPoint.x,
        y: this.startPoint.y,
        x2: current.x,
        y2: current.y,
        strokeColor: context.currentColor,
        strokeWidth: context.currentWidth,
      }
      context.sceneGraph.addObject(newObj)
      context.history.record({ type: 'ADD', object: newObj })
    }

    this.startPoint = null
    context.setPreviewObject(null)
    context.requestRender()
  }
}

export class ArrowTool implements BaseTool {
  public readonly name: ToolType = 'arrow'
  private isDrawing: boolean = false
  private startPoint: Point | null = null

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return
    this.isDrawing = true
    this.startPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)
  }

  public onPointerMove(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)

    const preview: ArrowObject = {
      id: 'preview',
      type: 'arrow',
      x: this.startPoint.x,
      y: this.startPoint.y,
      x2: current.x,
      y2: current.y,
      strokeColor: context.currentColor,
      strokeWidth: context.currentWidth,
    }
    context.setPreviewObject(preview)
    context.requestRender()
  }

  public onPointerUp(event: PointerEvent, context: ToolContext): void {
    if (!this.isDrawing || !this.startPoint) return
    this.isDrawing = false

    const current = context.viewport.screenToWorld(event.offsetX, event.offsetY)
    const dist = Math.hypot(current.x - this.startPoint.x, current.y - this.startPoint.y)

    if (dist > 3) {
      const newObj: ArrowObject = {
        id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        type: 'arrow',
        x: this.startPoint.x,
        y: this.startPoint.y,
        x2: current.x,
        y2: current.y,
        strokeColor: context.currentColor,
        strokeWidth: context.currentWidth,
      }
      context.sceneGraph.addObject(newObj)
      context.history.record({ type: 'ADD', object: newObj })
    }

    this.startPoint = null
    context.setPreviewObject(null)
    context.requestRender()
  }
}
