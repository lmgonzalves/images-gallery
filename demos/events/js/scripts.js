(function() {

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

  // Set dimensions
  function initDimensions () {
    width = window.innerWidth
    height = window.innerHeight
  }

  // Set initial values for uniforms
  function initUniforms () {
    uniforms = {
      uResolution: new PIXI.Point(width, height),
      uPointerDiff: new PIXI.Point(),
      uPointerDown: pointerDownTarget
    }
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
    const backgroundFilter = new PIXI.Filter(undefined, backgroundFragmentShader)
    // Assign the filter to the background Sprite
    background.filters = [backgroundFilter]
    // Add the background to the stage
    app.stage.addChild(background)
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
    console.log('down')
    const { x, y } = e.data.global
    pointerDownTarget = 1
    pointerStart.set(x, y)
    pointerDiffStart = uniforms.uPointerDiff.clone()
  }

  // On pointer up, set pointerDownTarget
  function onPointerUp () {
    console.log('up')
    pointerDownTarget = 0
  }

  // On pointer move, calculate coordinates diff
  function onPointerMove (e) {
    const { x, y } = e.data.global
    if (pointerDownTarget) {
      console.log('dragging')
      diffX = pointerDiffStart.x + (x - pointerStart.x)
      diffY = pointerDiffStart.y + (y - pointerStart.y)
    }
  }

  // Init everything
  function init () {
    initDimensions()
    initUniforms()
    initApp()
    initBackground()
    initEvents()
  }

  // Load resources, then init the app
  PIXI.Loader.shared.add([
    'shaders/stageFragment.glsl',
    'shaders/backgroundFragment.glsl'
  ]).load(init)

})()
