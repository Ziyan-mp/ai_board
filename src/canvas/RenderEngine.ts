import type { BoardObject } from '../core/BoardObject'
import type { Viewport } from '../core/Viewport'
import type { SceneGraph } from './SceneGraph'
import { registry } from '../core/Registry'

export class RenderEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas
    this.ctx = ctx
  }

  public render(sceneGraph: SceneGraph, viewport: Viewport, previewObject?: BoardObject | null): void {
    const dpr = window.devicePixelRatio || 1
    const logicalWidth = this.canvas.width / dpr
    const logicalHeight = this.canvas.height / dpr

    this.ctx.save()
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.scale(dpr, dpr)

    // Render Grid Background
    this.renderGrid(viewport, logicalWidth, logicalHeight)

    // Apply World Viewport Transformation Matrix
    this.ctx.save()
    this.ctx.translate(viewport.x, viewport.y)
    this.ctx.scale(viewport.zoom, viewport.zoom)

    // Render SceneGraph Objects in Z-Order
    const objects = sceneGraph.getObjects()
    for (const obj of objects) {
      this.renderObject(obj, viewport)
    }

    // Render Active Tool Preview Object (if drawing interactively)
    if (previewObject) {
      this.renderObject(previewObject, viewport)
    }

    // Render Selection Highlights & Handles
    this.renderSelection(sceneGraph, viewport)

    this.ctx.restore()
    this.ctx.restore()
  }

  private renderGrid(viewport: Viewport, width: number, height: number): void {
    const gridSize = 30 * viewport.zoom

    this.ctx.save()
    this.ctx.strokeStyle = '#e5e7eb'
    this.ctx.lineWidth = 1

    const startX = ((viewport.x % gridSize) + gridSize) % gridSize
    const startY = ((viewport.y % gridSize) + gridSize) % gridSize

    this.ctx.beginPath()
    for (let x = startX; x < width; x += gridSize) {
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, height)
    }
    for (let y = startY; y < height; y += gridSize) {
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(width, y)
    }
    this.ctx.stroke()
    this.ctx.restore()
  }

  public renderObject(obj: BoardObject, viewport: Viewport): void {
    const customRenderer = registry.getRenderer(obj.type)
    if (customRenderer) {
      customRenderer.render(this.ctx, obj, viewport)
      return
    }

    this.ctx.save()
    this.ctx.strokeStyle = obj.strokeColor || '#000000'
    this.ctx.fillStyle = obj.fillColor || 'transparent'
    this.ctx.lineWidth = obj.strokeWidth || 2
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    if (obj.opacity !== undefined) {
      this.ctx.globalAlpha = obj.opacity
    }

    switch (obj.type) {
      case 'freehand': {
        const points = obj.points || []
        if (points.length > 0) {
          this.ctx.beginPath()
          this.ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y)
          }
          this.ctx.stroke()
        }
        break
      }

      case 'rectangle': {
        const w = obj.width || 100
        const h = obj.height || 60
        this.ctx.beginPath()
        this.ctx.rect(obj.x, obj.y, w, h)
        if (obj.fillColor && obj.fillColor !== 'transparent') {
          this.ctx.fill()
        }
        this.ctx.stroke()
        break
      }

      case 'circle': {
        const r = obj.radius || 40
        this.ctx.beginPath()
        this.ctx.arc(obj.x, obj.y, r, 0, Math.PI * 2)
        if (obj.fillColor && obj.fillColor !== 'transparent') {
          this.ctx.fill()
        }
        this.ctx.stroke()
        break
      }

      case 'line': {
        const x2 = obj.x2 ?? obj.x
        const y2 = obj.y2 ?? obj.y
        this.ctx.beginPath()
        this.ctx.moveTo(obj.x, obj.y)
        this.ctx.lineTo(x2, y2)
        this.ctx.stroke()
        break
      }

      case 'arrow': {
        const x2 = obj.x2 ?? obj.x
        const y2 = obj.y2 ?? obj.y
        this.ctx.beginPath()
        this.ctx.moveTo(obj.x, obj.y)
        this.ctx.lineTo(x2, y2)
        this.ctx.stroke()

        // Render arrow head
        const angle = Math.atan2(y2 - obj.y, x2 - obj.x)
        const headLen = Math.max(10, (obj.strokeWidth || 2) * 3)
        this.ctx.beginPath()
        this.ctx.moveTo(x2, y2)
        this.ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        )
        this.ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        )
        this.ctx.closePath()
        this.ctx.fillStyle = obj.strokeColor || '#000000'
        this.ctx.fill()
        break
      }

      case 'text': {
        const fontSize = obj.fontSize || 20
        const fontFamily = obj.fontFamily || 'Arial, sans-serif'
        this.ctx.font = `${fontSize}px ${fontFamily}`
        this.ctx.fillStyle = obj.strokeColor || '#000000'
        this.ctx.textBaseline = 'top'
        this.ctx.fillText(obj.text || '', obj.x, obj.y)
        break
      }
    }

    this.ctx.restore()
  }

  private renderSelection(sceneGraph: SceneGraph, viewport: Viewport): void {
    const selectedObjects = sceneGraph.getSelectedObjects()
    if (selectedObjects.length === 0) return

    for (const obj of selectedObjects) {
      const bounds = sceneGraph.getObjectBounds(obj)
      const padding = 6 / viewport.zoom

      this.ctx.save()
      this.ctx.strokeStyle = '#3b82f6'
      this.ctx.lineWidth = 1.5 / viewport.zoom
      this.ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom])

      const sx = bounds.x - padding
      const sy = bounds.y - padding
      const sw = bounds.width + padding * 2
      const sh = bounds.height + padding * 2

      this.ctx.strokeRect(sx, sy, sw, sh)
      this.ctx.setLineDash([])

      // Draw handles at corners
      const handleSize = 8 / viewport.zoom
      const halfH = handleSize / 2
      this.ctx.fillStyle = '#ffffff'
      this.ctx.strokeStyle = '#3b82f6'

      const handles = [
        { x: sx, y: sy },
        { x: sx + sw, y: sy },
        { x: sx, y: sy + sh },
        { x: sx + sw, y: sy + sh },
      ]

      for (const h of handles) {
        this.ctx.fillRect(h.x - halfH, h.y - halfH, handleSize, handleSize)
        this.ctx.strokeRect(h.x - halfH, h.y - halfH, handleSize, handleSize)
      }

      this.ctx.restore()
    }
  }
}
