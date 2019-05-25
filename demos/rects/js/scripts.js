(function() {

  // Class to generate a random masonry layout, using a square grid as base
  class Grid {

    // The constructor receives all the following parameters:
    // - gridSize: The size (width and height) for smallest unit size
    // - gridColumns: Number of columns for the grid (width = gridColumns * gridSize)
    // - gridRows: Number of rows for the grid (height = gridRows * gridSize)
    // - gridMin: Min width and height limits for rectangles (in grid units)
    constructor(gridSize, gridColumns, gridRows, gridMin) {
      this.gridSize = gridSize
      this.gridColumns = gridColumns
      this.gridRows = gridRows
      this.gridMin = gridMin
      this.rects = []
      this.currentRects = [{ x: 0, y: 0, w: this.gridColumns, h: this.gridRows }]
    }

    // Takes the first rectangle on the list, and divides it in 2 more rectangles if possible
    splitCurrentRect () {
      if (this.currentRects.length) {
        const currentRect = this.currentRects.shift()
        const cutVertical = currentRect.w > currentRect.h
        const cutSide = cutVertical ? currentRect.w : currentRect.h
        const cutSize = cutVertical ? 'w' : 'h'
        const cutAxis = cutVertical ? 'x' : 'y'
        if (cutSide > this.gridMin * 2) {
          const rect1Size = randomInRange(this.gridMin, cutSide - this.gridMin)
          const rect1 = Object.assign({}, currentRect, { [cutSize]: rect1Size })
          const rect2 = Object.assign({}, currentRect, { [cutAxis]: currentRect[cutAxis] + rect1Size, [cutSize]: currentRect[cutSize] - rect1Size })
          drawRect(rect1)
          drawRect(rect2)
          this.currentRects.push(rect1, rect2)
        }
        else {
          this.rects.push(currentRect)
          this.splitCurrentRect()
        }
      } else {
        console.log('end')
      }
    }

    // Call `splitCurrentRect` until there is no more rectangles on the list
    // Then return the list of rectangles
    generateRects () {
      while (this.currentRects.length) {
        this.splitCurrentRect()
      }
      return this.rects
    }
  }

  // Generate a random integer in the range provided
  function randomInRange (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Generate a random color
  function randomColor () {
    const color = [0, 0, 0]
    for (let i = 0; i <= 2; i++) {
      if (Math.random() < 0.66666)
        color[i] = 32 + parseInt(Math.random() * 192)
    }
    return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')'
  }

  // Draw a rect in the canvas
  function drawRect (r) {
    ctx.fillStyle = r.color || randomColor()
    ctx.fillRect(r.x * gridSize, r.y * gridSize, r.w * gridSize, r.h * gridSize)
  }

  // Clear the canvas
  function clearCanvas () {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
  }

  // Variables and settings
  const next = document.getElementById('next')
  const all = document.getElementById('all')
  const reset = document.getElementById('reset')
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  const gridSize = 50
  const gridColumns = 20
  const gridRows = 10
  const gridMin = 3
  const width = gridSize * gridColumns
  const height = gridSize * gridRows
  canvas.width = width
  canvas.height = height

  // Start a new grid
  let grid
  function start () {
    grid = new Grid(gridSize, gridColumns, gridRows, gridMin)
  }
  start()

  // Listen for click on buttons and run the algoritm

  next.addEventListener('click', () => {
    grid.splitCurrentRect()
  })

  all.addEventListener('click', () => {
    grid.generateRects()
  })

  reset.addEventListener('click', () => {
    clearCanvas()
    start()
  })

})()
