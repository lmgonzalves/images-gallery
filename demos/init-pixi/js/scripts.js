(function() {

  // Get canvas view
  const view = document.querySelector('.view')
  let width, height, app

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

  // Init everything
  function init () {
    initDimensions()
    initApp()
  }
  // Initial call
  init()

})()
