// Adapted from: https://www.shadertoy.com/view/4lSGRw

#ifdef GL_ES
precision mediump float;
#endif

// Uniforms from Javascript
uniform vec2 uResolution;
uniform float uPointerDown;

// The texture is defined by PixiJS
varying vec2 vTextureCoord;
uniform sampler2D uSampler;

// Function used to get the distortion effect
vec2 computeUV (vec2 uv, float k, float kcube) {
  vec2 t = uv - 0.5;
  float r2 = t.x * t.x + t.y * t.y;
  float f = 0.0;
  if (kcube == 0.0) {
    f = 1.0 + r2 * k;
  } else {
    f = 1.0 + r2 * (k + kcube * sqrt(r2));
  }
  vec2 nUv = f * t + 0.5;
  nUv.y = 1.0 - nUv.y;
  return nUv;
}

void main () {
  // Normalized coordinates
  vec2 uv = gl_FragCoord.xy / uResolution.xy;

  // Settings for the effect
  // Multiplied by `uPointerDown`, a value between 0 and 1
  float k = -1.0 * uPointerDown;
  float kcube = 0.5 * uPointerDown;
  float offset = 0.02 * uPointerDown;
  
  // Get each channel's color using the texture provided by PixiJS
  // and the `computeUV` function
  float red = texture2D(uSampler, computeUV(uv, k + offset, kcube)).r;
  float green = texture2D(uSampler, computeUV(uv, k, kcube)).g;
  float blue = texture2D(uSampler, computeUV(uv, k - offset, kcube)).b;
  
  // Assing the final rgba color to `gl_FragColor`
  gl_FragColor = vec4(red, green, blue, 1.0);
}
