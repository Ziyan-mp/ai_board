import type { FreehandObject, BoardObject, RectangleObject, CircleObject, LineObject } from '../core/BoardObject'
import type { SceneGraph } from '../canvas/SceneGraph'
import type { HistoryManager } from '../core/HistoryManager'
import { StrokeRecognizer } from './StrokeRecognizer'

export class DiagramConverter {
  private recognizer: StrokeRecognizer = new StrokeRecognizer()

  public convertObject(
    freehandObj: FreehandObject,
    sceneGraph: SceneGraph,
    history: HistoryManager
  ): BoardObject | null {
    const result = this.recognizer.recognize(freehandObj)
    if (result.type === 'unknown' || result.confidence < 0.5) {
      return null
    }

    let converted: BoardObject | null = null

    switch (result.type) {
      case 'rectangle': {
        const rect: RectangleObject = {
          id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'rectangle',
          x: result.bounds.x,
          y: result.bounds.y,
          width: Math.max(10, result.bounds.width),
          height: Math.max(10, result.bounds.height),
          strokeColor: freehandObj.strokeColor || '#000000',
          strokeWidth: freehandObj.strokeWidth || 2,
          fillColor: freehandObj.fillColor || 'transparent',
        }
        converted = rect
        break
      }

      case 'circle': {
        const radius = Math.max(10, (result.bounds.width + result.bounds.height) / 4)
        const circle: CircleObject = {
          id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'circle',
          x: result.bounds.x + result.bounds.width / 2,
          y: result.bounds.y + result.bounds.height / 2,
          radius,
          strokeColor: freehandObj.strokeColor || '#000000',
          strokeWidth: freehandObj.strokeWidth || 2,
          fillColor: freehandObj.fillColor || 'transparent',
        }
        converted = circle
        break
      }

      case 'line': {
        const line: LineObject = {
          id: 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          type: 'line',
          x: freehandObj.x,
          y: freehandObj.y,
          x2: result.x2 ?? (freehandObj.x + result.bounds.width),
          y2: result.y2 ?? (freehandObj.y + result.bounds.height),
          strokeColor: freehandObj.strokeColor || '#000000',
          strokeWidth: freehandObj.strokeWidth || 2,
        }
        converted = line
        break
      }
    }

    if (converted) {
      sceneGraph.removeObject(freehandObj.id)
      sceneGraph.addObject(converted)

      history.record({
        type: 'BATCH',
        actions: [
          { type: 'DELETE', object: freehandObj },
          { type: 'ADD', object: converted },
        ],
      })
    }

    return converted
  }

  public convertAllFreehandStrokes(sceneGraph: SceneGraph, history: HistoryManager): number {
    const objects = [...sceneGraph.getObjects()]
    let count = 0

    for (const obj of objects) {
      if (obj.type === 'freehand') {
        const converted = this.convertObject(obj as FreehandObject, sceneGraph, history)
        if (converted) count++
      }
    }

    return count
  }
}
