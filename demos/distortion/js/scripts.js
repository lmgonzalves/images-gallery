(function() {

  // Get canvas view
  const view = document.querySelector('.view')
  // Loaded resources will be here
  const resources = PIXI.Loader.shared.resources
  // Target for pointer. If down, value is 1, else value is 0
  // Here we set it to 1 to see the effect, but initially it will be 0
  let pointerDownTarget = 1
  let width, height, app, background, uniforms

  // Set dimensions
  function initDimensions () {
    width = window.innerWidth
    height = window.innerHeight
  }

  // Set initial values for uniforms
  function initUniforms () {
    uniforms = {
      uResolution: new PIXI.Point(width, height),
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

  // Init everything
  function init () {
    initDimensions()
    initUniforms()
    initApp()
    initBackground()
  }

  // Load resources, then init the app
  PIXI.Loader.shared.add([
    'shaders/stageFragment.glsl',
    'shaders/backgroundFragment.glsl'
  ]).load(init)

})()
