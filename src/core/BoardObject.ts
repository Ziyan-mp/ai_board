export interface Point {
  x: number
  y: number
}

export interface BaseBoardObject {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  strokeColor?: string
  strokeWidth?: number
  fillColor?: string
  opacity?: number
  isLocked?: boolean
  isSelected?: boolean
}

export interface FreehandObject extends BaseBoardObject {
  type: 'freehand'
  points: Point[]
}

export interface RectangleObject extends BaseBoardObject {
  type: 'rectangle'
  width: number
  height: number
  borderRadius?: number
}

export interface CircleObject extends BaseBoardObject {
  type: 'circle'
  radius: number
}

export interface LineObject extends BaseBoardObject {
  type: 'line'
  x2: number
  y2: number
}

export interface ArrowObject extends BaseBoardObject {
  type: 'arrow'
  x2: number
  y2: number
}

export interface TextObject extends BaseBoardObject {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
}

export type KnownBoardObject =
  | FreehandObject
  | RectangleObject
  | CircleObject
  | LineObject
  | ArrowObject
  | TextObject

export type BoardObject = BaseBoardObject & Record<string, any>