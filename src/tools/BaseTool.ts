import type { ToolType } from './ToolType'
import type { SceneGraph } from '../canvas/SceneGraph'
import type { Viewport } from '../core/Viewport'
import type { HistoryManager } from '../core/HistoryManager'
import type { RenderEngine } from '../canvas/RenderEngine'
import type { BoardObject } from '../core/BoardObject'

export interface ToolContext {
  canvas: HTMLCanvasElement
  sceneGraph: SceneGraph
  viewport: Viewport
  history: HistoryManager
  renderEngine: RenderEngine
  currentColor: string
  currentWidth: number
  currentFill: string
  requestRender: () => void
  setPreviewObject: (obj: BoardObject | null) => void
}

export interface BaseTool {
  name: ToolType
  onPointerDown(event: PointerEvent, context: ToolContext): void
  onPointerMove(event: PointerEvent, context: ToolContext): void
  onPointerUp(event: PointerEvent, context: ToolContext): void
  onKeyDown?(event: KeyboardEvent, context: ToolContext): void
}
