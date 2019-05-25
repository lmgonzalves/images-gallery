(function() {

  // Get canvas view
  const view = document.querySelector('.view')
  // Loaded resources will be here
  const resources = PIXI.Loader.shared.resources
  let width, height, app, background

  // Set dimensions
  function initDimensions () {
    width = window.innerWidth
    height = window.innerHeight
  }

  // Init the PixiJS Application
  function initApp () {
    // Create a PixiJS Application, using the view (canvas) provided
    app = new PIXI.Application({ view })
    // Resizes renderer view in CSS pixels to allow for resolutions other than 1
    app.renderer.autoDensity = true
    // Resize the view to match viewport dimensions
    app.renderer.resize(width, height)
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
    initApp()
    initBackground()
  }

  // Load resources, then init the app
  PIXI.Loader.shared.add([
    'shaders/backgroundFragment.glsl'
  ]).load(init)

})()
