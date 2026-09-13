import './style.css'
import { BoardCanvas } from './canvas/BoardCanvas'
import type { ToolType } from './tools/ToolType'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app">
    <header class="top-bar">
      <div class="property-controls">
        <label title="Stroke Color">
          <input type="color" id="stroke-color" value="#000000" />
        </label>

        <label title="Stroke Width">
          <select id="stroke-width">
            <option value="1">Thin (1px)</option>
            <option value="2" selected>Medium (2px)</option>
            <option value="4">Thick (4px)</option>
            <option value="8">Extra Thick (8px)</option>
          </select>
        </label>

        <label title="Fill Color">
          <select id="fill-color">
            <option value="transparent" selected>No Fill</option>
            <option value="#3b82f6">Blue Fill</option>
            <option value="#ef4444">Red Fill</option>
            <option value="#10b981">Green Fill</option>
            <option value="#f59e0b">Yellow Fill</option>
          </select>
        </label>
      </div>

      <div class="top-actions">
        <button type="button" id="btn-undo" title="Undo (Ctrl+Z)">↶ Undo</button>
        <button type="button" id="btn-redo" title="Redo (Ctrl+Y)">↷ Redo</button>
        <button type="button" id="btn-clear" title="Clear Board">🗑 Clear</button>
      </div>
    </header>

    <main class="board-area">
      <aside class="left-toolbar">
        <button type="button" data-tool="select" class="tool-btn" title="Select (↖)">↖</button>
        <button type="button" data-tool="pen" class="tool-btn active" title="Pen (✎)">✎</button>
        <button type="button" data-tool="line" class="tool-btn" title="Line (╱)">╱</button>
        <button type="button" data-tool="rectangle" class="tool-btn" title="Rectangle (□)">□</button>
        <button type="button" data-tool="circle" class="tool-btn" title="Circle (○)">○</button>
        <button type="button" data-tool="arrow" class="tool-btn" title="Arrow (→)">→</button>
        <button type="button" data-tool="text" class="tool-btn" title="Text (T)">T</button>
        <button type="button" data-tool="eraser" class="tool-btn" title="Eraser (⌫)">⌫</button>
      </aside>

      <section class="canvas-container">
        <canvas id="board-canvas"></canvas>
      </section>
    </main>

    <footer class="bottom-bar">
      <div class="zoom-controls">
        <button type="button" id="btn-zoom-out">−</button>
        <span id="zoom-text">100%</span>
        <button type="button" id="btn-zoom-in">+</button>
        <button type="button" id="btn-zoom-reset">Reset</button>
      </div>

      <div class="status" id="status-text">
        Ready | Tool: Pen
      </div>
    </footer>
  </div>
`

const canvasElement = document.querySelector<HTMLCanvasElement>('#board-canvas')

if (!canvasElement) {
  throw new Error('Board canvas not found.')
}

const boardCanvas = new BoardCanvas(canvasElement)

// Tool Button Handling
const toolButtons = document.querySelectorAll<HTMLButtonElement>('[data-tool]')

toolButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const tool = button.dataset.tool as ToolType

    boardCanvas.setTool(tool)

    toolButtons.forEach((btn) => btn.classList.remove('active'))
    button.classList.add('active')

    updateStatus(`Tool: ${tool.toUpperCase()}`)
  })
})

// Color & Stroke Controls
const colorInput = document.querySelector<HTMLInputElement>('#stroke-color')

colorInput?.addEventListener('input', (e) => {
  boardCanvas.currentColor = (e.target as HTMLInputElement).value
})

const widthSelect = document.querySelector<HTMLSelectElement>('#stroke-width')

widthSelect?.addEventListener('change', (e) => {
  boardCanvas.currentWidth = parseInt(
    (e.target as HTMLSelectElement).value,
    10
  )
})

const fillSelect = document.querySelector<HTMLSelectElement>('#fill-color')

fillSelect?.addEventListener('change', (e) => {
  boardCanvas.currentFill = (e.target as HTMLSelectElement).value
})

// Undo / Redo / Clear Handlers
const undoBtn = document.querySelector<HTMLButtonElement>('#btn-undo')

undoBtn?.addEventListener('click', () => {
  boardCanvas.history.undo()
  updateStatus('Undo performed')
})

const redoBtn = document.querySelector<HTMLButtonElement>('#btn-redo')

redoBtn?.addEventListener('click', () => {
  boardCanvas.history.redo()
  updateStatus('Redo performed')
})

const clearBtn = document.querySelector<HTMLButtonElement>('#btn-clear')

clearBtn?.addEventListener('click', () => {
  if (boardCanvas.sceneGraph.getObjects().length > 0) {
    boardCanvas.sceneGraph.clear()
    boardCanvas.requestRender()
    updateStatus('Board cleared')
  }
})

// Zoom Controls
const zoomOutBtn =
  document.querySelector<HTMLButtonElement>('#btn-zoom-out')

const zoomInBtn =
  document.querySelector<HTMLButtonElement>('#btn-zoom-in')

const zoomResetBtn =
  document.querySelector<HTMLButtonElement>('#btn-zoom-reset')

const zoomText =
  document.querySelector<HTMLSpanElement>('#zoom-text')

function updateZoomDisplay(): void {
  if (zoomText) {
    zoomText.textContent =
      `${Math.round(boardCanvas.viewport.zoom * 100)}%`
  }
}

zoomOutBtn?.addEventListener('click', () => {
  boardCanvas.viewport.setZoom(
    boardCanvas.viewport.zoom * 0.9
  )

  updateZoomDisplay()
})

zoomInBtn?.addEventListener('click', () => {
  boardCanvas.viewport.setZoom(
    boardCanvas.viewport.zoom * 1.1
  )

  updateZoomDisplay()
})

zoomResetBtn?.addEventListener('click', () => {
  boardCanvas.viewport.reset()
  updateZoomDisplay()
})

boardCanvas.viewport.subscribe(() => updateZoomDisplay())

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        boardCanvas.history.redo()
        updateStatus('Redo performed')
      } else {
        boardCanvas.history.undo()
        updateStatus('Undo performed')
      }
    } else if (e.key.toLowerCase() === 'y') {
      boardCanvas.history.redo()
      updateStatus('Redo performed')
    }
  }
})

function updateStatus(text: string): void {
  const statusEl =
    document.querySelector<HTMLDivElement>('#status-text')

  if (statusEl) {
    statusEl.textContent = text
  }
}