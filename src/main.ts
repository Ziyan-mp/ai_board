import './style.css'
import { BoardCanvas } from './canvas/BoardCanvas'
import type { ToolType } from './tools/ToolType'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app">
    <main class="board-area">
      <section class="canvas-container">
        <canvas id="board-canvas"></canvas>
      </section>
    </main>

    <div class="floating-controls">
      <!-- Left: Collapsible Toolbar -->
      <div class="toolbar-container">
        <button type="button" id="btn-toggle-toolbar" class="floating-btn" title="Toggle Tools">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
        </button>
        <aside class="left-toolbar collapsed" id="left-toolbar">
          <button type="button" data-tool="select" class="tool-btn" title="Select (↖)">↖</button>
          <button type="button" data-tool="pen" class="tool-btn active" title="Pen (✎)">✎</button>
          <button type="button" data-tool="line" class="tool-btn" title="Line (╱)">╱</button>
          <button type="button" data-tool="rectangle" class="tool-btn" title="Rectangle (□)">□</button>
          <button type="button" data-tool="circle" class="tool-btn" title="Circle (○)">○</button>
          <button type="button" data-tool="arrow" class="tool-btn" title="Arrow (→)">→</button>
          <button type="button" data-tool="text" class="tool-btn" title="Text (T)">T</button>
          <button type="button" data-tool="eraser" class="tool-btn" title="Eraser (⌫)">⌫</button>
          
          <div class="tool-settings-anchor">
            <button type="button" id="btn-tool-settings" class="floating-btn small" title="Tool Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            
            <div class="settings-popover hidden" id="settings-popover">
              <div class="property-controls">
                <label title="Stroke Color">
                  <input type="color" id="stroke-color" value="#000000" />
                </label>
                <label title="Stroke Width">
                  <select id="stroke-width">
                    <option value="1">Thin</option>
                    <option value="2" selected>Medium</option>
                    <option value="4">Thick</option>
                    <option value="8">Extra Thick</option>
                  </select>
                </label>
                <label title="Fill Color">
                  <select id="fill-color">
                    <option value="transparent" selected>No Fill</option>
                    <option value="#3b82f6">Blue</option>
                    <option value="#ef4444">Red</option>
                    <option value="#10b981">Green</option>
                    <option value="#f59e0b">Yellow</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Top Right: Undo/Redo/Clear -->
      <div class="top-right-controls floating-panel">
        <button type="button" id="btn-undo" class="action-btn" title="Undo (Ctrl+Z)">↶</button>
        <button type="button" id="btn-redo" class="action-btn" title="Redo (Ctrl+Y)">↷</button>
        <div class="divider"></div>
        <button type="button" id="btn-clear" class="action-btn danger" title="Clear Board">🗑</button>
      </div>

      <!-- Bottom Right: Zoom Controls -->
      <div class="bottom-right-controls floating-panel">
        <button type="button" id="btn-zoom-out" class="action-btn">−</button>
        <span id="zoom-text">100%</span>
        <button type="button" id="btn-zoom-in" class="action-btn">+</button>
        <button type="button" id="btn-zoom-reset" class="action-btn text-btn">Reset</button>
      </div>
    </div>
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
  // Removed status text for minimal UI
  console.log(text)
}

// UI Toggles
const toggleToolbarBtn = document.querySelector<HTMLButtonElement>('#btn-toggle-toolbar')
const leftToolbar = document.querySelector<HTMLElement>('#left-toolbar')

toggleToolbarBtn?.addEventListener('click', () => {
  leftToolbar?.classList.toggle('collapsed')
})

const toolSettingsBtn = document.querySelector<HTMLButtonElement>('#btn-tool-settings')
const settingsPopover = document.querySelector<HTMLDivElement>('#settings-popover')

toolSettingsBtn?.addEventListener('click', (e) => {
  e.stopPropagation()
  settingsPopover?.classList.toggle('hidden')
})

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!settingsPopover?.contains(target) && target !== toolSettingsBtn) {
    settingsPopover?.classList.add('hidden')
  }
})