import type { FreehandObject, Point } from '../core/BoardObject'

export interface RecognitionResult {
  type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'unknown'
  confidence: number
  bounds: { x: number; y: number; width: number; height: number }
  x2?: number
  y2?: number
}

export class StrokeRecognizer {
  public recognize(freehandObj: FreehandObject): RecognitionResult {
    const points = freehandObj.points || []
    if (points.length < 5) {
      return {
        type: 'unknown',
        confidence: 0,
        bounds: { x: freehandObj.x, y: freehandObj.y, width: 0, height: 0 },
      }
    }

    // 1. Calculate Bounding Box
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const p of points) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }

    const width = maxX - minX
    const height = maxY - minY
    const bounds = { x: minX, y: minY, width, height }
    const diagonal = Math.hypot(width, height)

    // 2. Closure Score (distance between start and end point)
    const first = points[0]
    const last = points[points.length - 1]
    const closureDist = Math.hypot(last.x - first.x, last.y - first.y)
    const isClosed = closureDist < Math.max(25, diagonal * 0.2)

    // 3. Path Length vs Straight Distance
    let totalPathLength = 0
    for (let i = 1; i < points.length; i++) {
      totalPathLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
    }

    const startEndDist = Math.hypot(last.x - first.x, last.y - first.y)

    // 4. Line Check (if open and path length is close to straight distance)
    if (!isClosed && totalPathLength / Math.max(1, startEndDist) < 1.25) {
      return {
        type: 'line',
        confidence: 0.85,
        bounds,
        x2: last.x,
        y2: last.y,
      }
    }

    // 5. Circle vs Polygon Classification (if closed)
    if (isClosed) {
      const centerX = minX + width / 2
      const centerY = minY + height / 2
      const targetRadius = (width + height) / 4

      // Calculate radius variance from center
      let totalRadiusDiff = 0
      for (const p of points) {
        const dist = Math.hypot(p.x - centerX, p.y - centerY)
        totalRadiusDiff += Math.abs(dist - targetRadius)
      }
      const avgRadiusDiff = totalRadiusDiff / points.length
      const circleErrorRatio = avgRadiusDiff / targetRadius

      // Aspect ratio
      const aspectRatio = width / Math.max(1, height)

      if (circleErrorRatio < 0.25 && aspectRatio > 0.65 && aspectRatio < 1.5) {
        return {
          type: 'circle',
          confidence: Math.max(0.6, 1 - circleErrorRatio),
          bounds,
        }
      }

      // Check for Corners (Rectangle / Square)
      const corners = this.findCorners(points)
      if (corners.length >= 3 && corners.length <= 5) {
        return {
          type: 'rectangle',
          confidence: 0.8,
          bounds,
        }
      }
    }

    return {
      type: 'unknown',
      confidence: 0.3,
      bounds,
    }
  }

  private findCorners(points: Point[]): Point[] {
    const corners: Point[] = []
    const windowSize = Math.max(2, Math.floor(points.length / 15))

    for (let i = windowSize; i < points.length - windowSize; i++) {
      const prev = points[i - windowSize]
      const curr = points[i]
      const next = points[i + windowSize]

      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
      const v2 = { x: next.x - curr.x, y: next.y - curr.y }

      const dot = v1.x * v2.x + v1.y * v2.y
      const mag1 = Math.hypot(v1.x, v1.y)
      const mag2 = Math.hypot(v2.x, v2.y)

      if (mag1 > 0 && mag2 > 0) {
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
        const angle = Math.acos(cosAngle) * (180 / Math.PI)
        // Sharp turn
        if (angle > 45) {
          corners.push(curr)
          i += windowSize // Skip nearby points
        }
      }
    }

    return corners
  }
}
