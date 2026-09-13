import type { ToolType } from '../tools/ToolType'
import type { BoardObject } from '../core/BoardObject'
import type { BaseTool, ToolContext } from '../tools/BaseTool'
import { Viewport } from '../core/Viewport'
import { SceneGraph } from './SceneGraph'
import { RenderEngine } from './RenderEngine'
import { HistoryManager } from '../core/HistoryManager'
import { PenTool } from '../tools/PenTool'
import { RectangleTool, CircleTool, LineTool, ArrowTool } from '../tools/ShapeTools'
import { SelectTool } from '../tools/SelectTool'
import { EraserTool } from '../tools/EraserTool'
import { TextTool } from '../tools/TextTool'

export class BoardCanvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  public viewport: Viewport
  public sceneGraph: SceneGraph
  public history: HistoryManager
  private renderEngine: RenderEngine

  private tools: Map<ToolType, BaseTool> = new Map()
  private activeToolType: ToolType = 'pen'

  public currentColor: string = '#000000'
  public currentWidth: number = 2
  public currentFill: string = 'transparent'

  private previewObject: BoardObject | null = null
  private isPanning: boolean = false
  private panStartScreen: { x: number; y: number } = { x: 0, y: 0 }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Unable to create canvas 2D context.')
    }
    this.ctx = context

    this.viewport = new Viewport()
    this.sceneGraph = new SceneGraph()
    this.history = new HistoryManager()
    this.renderEngine = new RenderEngine(this.canvas, this.ctx)

    this.registerDefaultTools()
    this.setupHistoryCallback()
    this.setupViewportListener()
    this.setupEventListeners()
    this.resizeCanvas()
  }

  private registerDefaultTools(): void {
    this.tools.set('pen', new PenTool())
    this.tools.set('rectangle', new RectangleTool())
    this.tools.set('circle', new CircleTool())
    this.tools.set('line', new LineTool())
    this.tools.set('arrow', new ArrowTool())
    this.tools.set('select', new SelectTool())
    this.tools.set('eraser', new EraserTool())
    this.tools.set('text', new TextTool())
  }

  public registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool)
  }

  private setupHistoryCallback(): void {
    this.history.setApplyCallback((action, isUndo) => {
      const applySingle = (act: typeof action) => {
        if (act.type === 'ADD') {
          if (isUndo) this.sceneGraph.removeObject(act.object.id)
          else this.sceneGraph.addObject(act.object)
        } else if (act.type === 'DELETE') {
          if (isUndo) this.sceneGraph.addObject(act.object)
          else this.sceneGraph.removeObject(act.object.id)
        } else if (act.type === 'UPDATE') {
          const target = isUndo ? act.before : act.after
          this.sceneGraph.updateObject(target)
        }
      }

      if (action.type === 'BATCH') {
        action.actions.forEach(applySingle)
      } else {
        applySingle(action)
      }
      this.requestRender()
    })
  }

  private setupViewportListener(): void {
    this.viewport.subscribe(() => this.requestRender())
  }

  public resizeCanvas(): void {
    const container = this.canvas.parentElement
    if (!container) return

    const dpr = window.devicePixelRatio || 1
    const width = container.clientWidth
    const height = container.clientHeight

    this.canvas.width = width * dpr
    this.canvas.height = height * dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    this.requestRender()
  }

  private createToolContext(): ToolContext {
    return {
      canvas: this.canvas,
      sceneGraph: this.sceneGraph,
      viewport: this.viewport,
      history: this.history,
      renderEngine: this.renderEngine,
      currentColor: this.currentColor,
      currentWidth: this.currentWidth,
      currentFill: this.currentFill,
      requestRender: () => this.requestRender(),
      setPreviewObject: (obj) => {
        this.previewObject = obj
      },
    }
  }

  private isSpacePressed: boolean = false

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resizeCanvas())

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') this.isSpacePressed = true
    })

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.isSpacePressed = false
    })

    // Pointer event listeners
    this.canvas.addEventListener('pointerdown', (e) => {
      try {
        this.canvas.setPointerCapture(e.pointerId)
      } catch (_err) {
        // ignore fallback
      }

      // Middle click or Space + Left click pan
      if (e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
        this.isPanning = true
        this.panStartScreen = { x: e.clientX, y: e.clientY }
        return
      }

      const activeTool = this.tools.get(this.activeToolType)
      if (activeTool) {
        activeTool.onPointerDown(e, this.createToolContext())
      }
    })

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.isPanning) {
        const dx = e.clientX - this.panStartScreen.x
        const dy = e.clientY - this.panStartScreen.y
        this.panStartScreen = { x: e.clientX, y: e.clientY }
        this.viewport.pan(dx, dy)
        return
      }

      const activeTool = this.tools.get(this.activeToolType)
      if (activeTool) {
        activeTool.onPointerMove(e, this.createToolContext())
      }
    })

    this.canvas.addEventListener('pointerup', (e) => {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId)
      }

      if (this.isPanning) {
        this.isPanning = false
        return
      }

      const activeTool = this.tools.get(this.activeToolType)
      if (activeTool) {
        activeTool.onPointerUp(e, this.createToolContext())
      }
    })

    // Wheel zoom & pan
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9
        const rect = this.canvas.getBoundingClientRect()
        this.viewport.setZoom(this.viewport.zoom * zoomDelta, e.clientX - rect.left, e.clientY - rect.top)
      } else {
        // Pan
        this.viewport.pan(-e.deltaX, -e.deltaY)
      }
    }, { passive: false })
  }

  public setTool(tool: ToolType): void {
    this.activeToolType = tool
    this.sceneGraph.clearSelection()
    this.requestRender()
  }

  public getTool(): ToolType {
    return this.activeToolType
  }

  private isRenderPending: boolean = false

  public requestRender(): void {
    if (this.isRenderPending) return
    this.isRenderPending = true

    requestAnimationFrame(() => {
      this.isRenderPending = false
      this.renderEngine.render(this.sceneGraph, this.viewport, this.previewObject)
    })
  }
}