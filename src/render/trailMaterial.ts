import * as THREE from 'three';
import type { ColorMode, DrawMode } from '../app/store';

export const DRAW_MODE_INDEX: Record<DrawMode, number> = { full: 0, trace: 1, fleeting: 2 };
export const COLOR_MODE_INDEX: Record<ColorMode, number> = { solid: 0, time: 1, speed: 2 };

const vertexShader = /* glsl */ `
  attribute float aTime;
  attribute float aSpeed;
  uniform float uZScale;
  varying float vTime;
  varying float vSpeed;
  void main() {
    vTime = aTime;
    vSpeed = aSpeed;
    vec3 p = position;
    p.y *= uZScale;            // scene y = ecliptic z (out-of-plane)
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uNow;
  uniform float uFade;
  uniform float uIntensity;
  uniform float uGlobal;
  uniform float uHueCycles;
  uniform float uHueOffset;
  uniform int uDrawMode;
  uniform int uColorMode;
  uniform bool uLoop;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vTime;
  varying float vSpeed;

  // soft pastel cosine palette (after Inigo Quilez)
  vec3 palette(float t) {
    vec3 a = vec3(0.62, 0.60, 0.70);
    vec3 b = vec3(0.30, 0.26, 0.28);
    vec3 d = vec3(0.00, 0.33, 0.67);
    return a + b * cos(6.28318 * (t + d));
  }

  void main() {
    float age = uNow - vTime;
    float alpha = 1.0;
    if (uDrawMode == 1) {                 // trace
      if (age < 0.0) discard;
      alpha = 1.0 + 1.5 * exp(-age / 0.004);   // bright leading edge
    } else if (uDrawMode == 2) {          // fleeting
      if (uLoop) age = fract(age);
      else if (age < 0.0) discard;
      alpha = exp(-age / max(uFade, 1e-4)) * 1.6;
    }
    alpha *= uGlobal;
    if (alpha < 0.003) discard;

    vec3 col;
    if (uColorMode == 0) col = mix(uColorB, uColorA, 0.25);
    else if (uColorMode == 1) col = palette(vTime * uHueCycles + uHueOffset);
    else col = mix(uColorB * 0.35, vec3(1.0, 0.97, 0.92), smoothstep(0.05, 1.0, vSpeed));

    gl_FragColor = vec4(col * uIntensity, alpha);
  }
`;

export function createTrailMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uNow: { value: 0 },
      uFade: { value: 0.15 },
      uIntensity: { value: 0.7 },
      uGlobal: { value: 1 },
      uHueCycles: { value: 1 },
      uHueOffset: { value: 0 },
      uDrawMode: { value: 2 },
      uColorMode: { value: 1 },
      uLoop: { value: true },
      uZScale: { value: 1 },
      uColorA: { value: new THREE.Color('#ffffff') },
      uColorB: { value: new THREE.Color('#ffffff') },
    },
  });
}
