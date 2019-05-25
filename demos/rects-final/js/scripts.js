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
          this.currentRects.push(rect1, rect2)
        }
        else {
          this.rects.push(currentRect)
          this.splitCurrentRect()
        }
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

  // Get canvas view
  const view = document.querySelector('.view')
  // Loaded resources will be here
  const resources = PIXI.Loader.shared.resources
  // Target for pointer. If down, value is 1, else value is 0
  let pointerDownTarget = 0
  // Useful variables to keep track of the pointer
  let pointerStart = new PIXI.Point()
  let pointerDiffStart = new PIXI.Point()
  let width, height, app, background, uniforms, diffX, diffY

  // Variables and settings for grid
  const gridSize = 50
  const gridMin = 3
  const imagePadding = 20
  let gridColumnsCount, gridRowsCount, gridColumns, gridRows, grid
  let widthRest, heightRest, centerX, centerY, container, rects

  // Set dimensions
  function initDimensions () {
    width = window.innerWidth
    height = window.innerHeight
    diffX = 0
    diffY = 0
  }

  // Set initial values for uniforms
  function initUniforms () {
    uniforms = {
      uResolution: new PIXI.Point(width, height),
      uPointerDiff: new PIXI.Point(),
      uPointerDown: pointerDownTarget
    }
  }

  // Initialize the random grid layout
  function initGrid () {
    // Getting columns
    gridColumnsCount = Math.ceil(width / gridSize)
    // Getting rows
    gridRowsCount = Math.ceil(height / gridSize)
    // Make the grid 5 times bigger than viewport
    gridColumns = gridColumnsCount * 5
    gridRows = gridRowsCount * 5
    // Create a new Grid instance with our settings
    grid = new Grid(gridSize, gridColumns, gridRows, gridMin)
    // Calculate the center position for the grid in the viewport
    widthRest = Math.ceil(gridColumnsCount * gridSize - width)
    heightRest = Math.ceil(gridRowsCount * gridSize - height)
    centerX = (gridColumns * gridSize / 2) - (gridColumnsCount * gridSize / 2)
    centerY = (gridRows * gridSize / 2) - (gridRowsCount * gridSize / 2)
    // Generate the list of rects
    rects = grid.generateRects()
  }

  // Init the PixiJS Application
  function initApp () {
    // Create a PixiJS Application, using the view (canvas) provided
    app = new PIXI.Application({ view })
    // Resizes renderer view in CSS pixels to allow for resolutions other than 1
    app.renderer.autoDensity = true
    // Resize the view to match viewport dimensions
    app.renderer.resize(width, height)

    // Set the distortion filter for the entire stage
    const stageFragmentShader = resources['shaders/stageFragment.glsl'].data
    const stageFilter = new PIXI.Filter(undefined, stageFragmentShader, uniforms)
    app.stage.filters = [stageFilter]
  }

  // Init the gridded background
  function initBackground () {
    // Create a new empty Sprite and define its size
    background = new PIXI.Sprite()
    background.width = width
    background.height = height
    // Get the code for the fragment shader from the loaded resources
    const backgroundFragmentShader = resources['shaders/backgroundFragment.glsl'].data
    // Create a new Filter using the fragment shader
    // We don't need a custom vertex shader, so we set it as `undefined`
    const backgroundFilter = new PIXI.Filter(undefined, backgroundFragmentShader, uniforms)
    // Assign the filter to the background Sprite
    background.filters = [backgroundFilter]
    // Add the background to the stage
    app.stage.addChild(background)
  }

  // Initialize a Container element for solid rectangles and images
  function initContainer () {
    container = new PIXI.Container()
    app.stage.addChild(container)
  }

  // Add solid rectangles and images
  // So far, we will only add rectangles
  function initRectsAndImages () {
    // Create a new Graphics element to draw solid rectangles
    const graphics = new PIXI.Graphics()
    // Select the color for rectangles
    graphics.beginFill(0xAA22CC)
    // Loop over each rect in the list
    rects.forEach(rect => {
      // Draw the rectangle
      graphics.drawRect(
        rect.x * gridSize,
        rect.y * gridSize,
        rect.w * gridSize - imagePadding,
        rect.h * gridSize - imagePadding
      )
    })
    // Ends the fill action
    graphics.endFill()
    // Add the graphics (with all drawn rects) to the container
    container.addChild(graphics)
  }

  // Start listening events
  function initEvents () {
    // Make stage interactive, so it can listen to events
    app.stage.interactive = true

    // Pointer & touch events are normalized into
    // the `pointer*` events for handling different events
    app.stage
      .on('pointerdown', onPointerDown)
      .on('pointerup', onPointerUp)
      .on('pointerupoutside', onPointerUp)
      .on('pointermove', onPointerMove)
  }

  // On pointer down, save coordinates and set pointerDownTarget
  function onPointerDown (e) {
    const { x, y } = e.data.global
    pointerDownTarget = 1
    pointerStart.set(x, y)
    pointerDiffStart = uniforms.uPointerDiff.clone()
  }

  // On pointer up, set pointerDownTarget
  function onPointerUp () {
    pointerDownTarget = 0
  }

  // On pointer move, calculate coordinates diff
  function onPointerMove (e) {
    const { x, y } = e.data.global
    if (pointerDownTarget) {
      diffX = pointerDiffStart.x + (x - pointerStart.x)
      diffY = pointerDiffStart.y + (y - pointerStart.y)
      diffX = diffX > 0 ? Math.min(diffX, centerX + imagePadding) : Math.max(diffX, -(centerX + widthRest))
      diffY = diffY > 0 ? Math.min(diffY, centerY + imagePadding) : Math.max(diffY, -(centerY + heightRest))
    }
  }

  // Init everything
  function init () {
    initDimensions()
    initUniforms()
    initGrid()
    initApp()
    initBackground()
    initContainer()
    initRectsAndImages()
    initEvents()

    // Animation loop
    // Code here will be executed on every animation frame
    app.ticker.add(() => {
      // Multiply the values by a coefficient to get a smooth animation
      uniforms.uPointerDown += (pointerDownTarget - uniforms.uPointerDown) * 0.075
      uniforms.uPointerDiff.x += (diffX - uniforms.uPointerDiff.x) * 0.2
      uniforms.uPointerDiff.y += (diffY - uniforms.uPointerDiff.y) * 0.2
      // Set position for the container
      container.x = uniforms.uPointerDiff.x - centerX
      container.y = uniforms.uPointerDiff.y - centerY
    })
  }

  // Load resources, then init the app
  PIXI.Loader.shared.add([
    'shaders/stageFragment.glsl',
    'shaders/backgroundFragment.glsl'
  ]).load(init)

})()
