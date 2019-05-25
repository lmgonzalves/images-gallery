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
  let width, height
  let container, background
  let uniforms
  let app
  let diffX, diffY

  // Variables and settings for grid
  const gridSize = 50
  const gridMin = 3
  const imagePadding = 20
  let gridColumnsCount, gridRowsCount, gridColumns, gridRows, grid
  let widthRest, heightRest, centerX, centerY
  let rects, images, imagesUrls

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
    // For the list of images
    images = []
    // For storing the image URL and avoid duplicates
    imagesUrls = {}
  }

  // Init the PixiJS Application
  function initApp () {
    // Create a PixiJS Application, using the view (canvas) provided
    app = new PIXI.Application({ view })
    // Resizes renderer view in CSS pixels to allow for resolutions other than 1
    app.renderer.autoDensity = true
    // Resize the view to match viewport size
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
    // Create a new Filter using the fragment shader and the uniforms
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

  // Load texture for an image, giving its index
  function loadTextureForImage (index) {
    // Get image Sprite
    const image = images[index]
    // Set the url to get a random image from Unsplash Source, given image dimensions
    const url = `https://source.unsplash.com/random/${image.width}x${image.height}`
    // Get the corresponding rect, to store more data needed (it is a normal Object)
    const rect = rects[index]
    // Create a new AbortController, to abort fetch if needed
    const { signal } = rect.controller = new AbortController()
    // Fetch the image
    fetch(url, { signal }).then(response => {
      // Get image URL, and if it was downloaded before, load another image
      // Otherwise, save image URL and set the texture
      const id = response.url.split('?')[0]
      if (imagesUrls[id]) {
        loadTextureForImage(index)
      } else {
        imagesUrls[id] = true
        image.texture = PIXI.Texture.from(response.url)
        rect.loaded = true
      }
    }).catch(() => {
      // Catch errors silently, for not showing the following error message if it is aborted:
      // AbortError: The operation was aborted.
    })
  }

  // Add solid rectangles and images
  function initRectsAndImages () {
    // Create a new Graphics element to draw solid rectangles
    const graphics = new PIXI.Graphics()
    // Select the color for rectangles
    graphics.beginFill(0x000000)
    // Loop over each rect in the list
    rects.forEach(rect => {
      // Create a new Sprite element for each image
      const image = new PIXI.Sprite()
      // Set image's position and size
      image.x = rect.x * gridSize
      image.y = rect.y * gridSize
      image.width = rect.w * gridSize - imagePadding
      image.height = rect.h * gridSize - imagePadding
      // Set it's alpha to 0, so it is not visible initially
      image.alpha = 0
      // Add image to the list
      images.push(image)
      // Draw the rectangle
      graphics.drawRect(image.x, image.y, image.width, image.height)
    })
    // Ends the fill action
    graphics.endFill()
    // Add the graphics (with all drawn rects) to the container
    container.addChild(graphics)
    // Add all image's Sprites to the container
    images.forEach(image => {
      container.addChild(image)
    })
  }

  // Check if rects intersects with the viewport
  // and loads corresponding image
  function checkRectsAndImages () {
    // Loop over rects
    rects.forEach((rect, index) => {
      // Get corresponding image
      const image = images[index]
      // Check if the rect intersects with the viewport
      if (rectIntersectsWithViewport(rect)) {
        // If rect just has been discovered
        // start loading image
        if (!rect.discovered) {
          rect.discovered = true
          loadTextureForImage(index)
        }
        // If image is loaded, increase alpha if possible
        if (rect.loaded && image.alpha < 1) {
          image.alpha += 0.01
        }
      } else { // The rect is not intersecting
        // If the rect was discovered before, but the
        // image is not loaded yet, abort the fetch
        if (rect.discovered && !rect.loaded) {
          rect.discovered = false
          rect.controller.abort()
        }
        // Decrease alpha if possible
        if (image.alpha > 0) {
          image.alpha -= 0.01
        }
      }
    })
  }

  // Check if a rect intersects the viewport
  function rectIntersectsWithViewport (rect) {
    return (
      rect.x * gridSize + container.x <= width &&
      0 <= (rect.x + rect.w) * gridSize + container.x &&
      rect.y * gridSize + container.y <= height &&
      0 <= (rect.y + rect.h) * gridSize + container.y
    )
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
      // Check rects and load/cancel images as needded
      checkRectsAndImages()
    })
  }

  // Clean the current Application
  function clean () {
    // Stop the current animation
    app.ticker.stop()

    // Remove event listeners
    app.stage
      .off('pointerdown', onPointerDown)
      .off('pointerup', onPointerUp)
      .off('pointerupoutside', onPointerUp)
      .off('pointermove', onPointerMove)

    // Abort all fetch calls in progress
    rects.forEach(rect => {
      if (rect.discovered && !rect.loaded) {
        rect.controller.abort()
      }
    })
  }

  // On resize, reinit the app (clean and init)
  // But first debounce the calls, so we don't call init too often
  let resizeTimer
  function onResize () {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      clean()
      init()
    }, 200)
  }
  // Listen to resize event
  window.addEventListener('resize', onResize)

  // Load resources, then init the app
  PIXI.Loader.shared.add([
    'shaders/stageFragment.glsl',
    'shaders/backgroundFragment.glsl'
  ]).load(init)

})()
