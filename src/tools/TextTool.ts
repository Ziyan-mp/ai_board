import type { BaseTool, ToolContext } from './BaseTool'
import type { TextObject } from '../core/BoardObject'
import type { ToolType } from './ToolType'

export class TextTool implements BaseTool {
  public readonly name: ToolType = 'text'

  public onPointerDown(event: PointerEvent, context: ToolContext): void {
    if (event.button !== 0) return

    const worldPoint = context.viewport.screenToWorld(event.offsetX, event.offsetY)

    // Prompt user for text input
    const input = window.prompt('Enter text:')
    if (!input || input.trim() === '') return

    const textObj: TextObject = {
      id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: 'text',
      x: worldPoint.x,
      y: worldPoint.y,
      text: input.trim(),
      fontSize: 20,
      fontFamily: 'Arial, sans-serif',
      strokeColor: context.currentColor,
    }

    context.sceneGraph.addObject(textObj)
    context.history.record({ type: 'ADD', object: textObj })
    context.requestRender()
  }

  public onPointerMove(_event: PointerEvent, _context: ToolContext): void {}
  public onPointerUp(_event: PointerEvent, _context: ToolContext): void {}
}
