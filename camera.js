import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupCameraControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Enable damping (inertia)
  controls.dampingFactor = 0.25; // Damping factor
  controls.screenSpacePanning = false; // Do not allow panning in screen space
  controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to 90 degrees
  return controls;
}
