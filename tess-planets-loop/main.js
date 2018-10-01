import * as capture from '../vendor/recorder.js';



import * as tilesaver from '../app/tilesaver.js';
import {initGui, addThreeV3Slider} from "../shared/generateGui.js";

import vertexShader from "../shaders/tessPlanetLoopVS.js";
import fragmentShader from "../shaders/tessPlanetFS.js";

import fullscreenVS from "../shaders/fullscreenVS.js";
import backgroundFS from "../shaders/backgroundFS.js";

const W = 1280;
const H = 800;

let RENDERING = false;
let TILES = 3;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars

const clock = new THREE.Clock();

// *LOOPING*
const loopPeriod = 10; // in seconds
let loopValue = 0; // position inside the loop [0..1)

let gui;

// const numDots = Math.floor(lineSubdivisions / 6);

let frameRequestId;

const planetPositions = [
  {x: -6.7, y: -5.0, z: 0.0}, // {x: -8.3, y: 0.0, z: 0.0}
  // {x: 18.0, y: 30.0, z: -167.0},
  // {x: 32.5, y: -8.0, z: -60.0},
];

const uniforms = {
  time: {type: "f", value: 0.0, hideinGui: true},
  aspectRatio: {type: "f", value: W / H, hideinGui: true},

  // Experimental
  // backgroundColor: {type: "3fv", value: [0.05, 0.04, 0.1], color: true},
  //
  // outerColor0: {type: "3fv", value: [0.16, 0.16, 0.16], color: true},
  // outerColor1: {type: "3fv", value: [0, 0, 0], color: true},
  //
  // innerColor0: {type: "3fv", value: [0.07, 0.11, 0.4], color: true},
  // innerColor1: {type: "3fv", value: [0.74, 0.89, 0.75], color: true},
  //
  // radius: {type: "f", value: 7.5, step: 0.1},
  // displacementDistance: {type: "f", value: -0.12, step: 0.01}, // 1.4 , 0.01
  //
  // innerRadius: {type: "f", value: 7.6, step: 0.1}, // 6.0, 0.1
  // innerDisplacementDistance: {type: "f", value: 0.17, step: 0.01}, // 0.8, 0.01
  //
  // noiseSpeed: {type: "f", value: 0.015, step: 0.015}, // 0.1, 0.001
  // noiseScale: {type: "f", value: 25, step: 0.01}, // 2.0, 0.01
  // noiseMinValue: {type: "f", value: -1, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01
  //
  // lineStepSize: {type: "f", value: 0.04, min: 0.0, step: 0.01}, // value: 0.1
  // lineWeight: {type: "f", value: 0.021, min: 0.0, step: 0.001}, // value: 0.008
  // lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},
  //
  // facingCull: {type: "f", value: 0.036, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  // facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},
  //
  // outerOpacity:  {type: "f", value: 0.0, min: 0.0, max: 1.0, step: 0.001},
  // innerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},
  //
  // rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  // rotationSpeed:  {type: "f", value: 0.5, min: -10.0, max: 10.0, step: 0.001},
  //
  // minDistance: {type: "f", value: -50.0},
  // maxDistance: {type: "f", value: 200.0},
  //
  // saturationValue: {type: "f", value: 0.25}, // 0.5
  // brightnessValue: {type: "f", value: -0.025}, // 0.3


  // Glowing Pink; slighty adapted
  backgroundColor: {type: "3fv", value: [1.0, 1.0, 1.0], color: true},

  outerColor0: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},
  outerColor1: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},

  innerColor0: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},
  innerColor1: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},

  radius: {type: "f", value: 8.7, step: 0.1},
  displacementDistance: {type: "f", value: 1.12, step: 0.01}, // 1.4 , 0.01

  innerRadius: {type: "f", value: 7.9, step: 0.1}, // 6.0, 0.1
  innerDisplacementDistance: {type: "f", value: 1.19, step: 0.01}, // 0.8, 0.01

  noiseSpeed: {type: "f", value: 0.244, step: 0.001}, // 0.1, 0.001
  noiseScale: {type: "f", value: 3.0, step: 0.01}, // 2.0, 0.01
  noiseMinValue: {type: "f", value: -1.0, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01

  lineStepSize: {type: "f", value: 0.01, min: 0.0, step: 0.01}, // value: 0.1
  lineWeight: {type: "f", value: 0.003, min: 0.0, step: 0.001}, // value: 0.008
  lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},

  facingCull: {type: "f", value: -0.07, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},

  outerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},
  innerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},

  rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  rotationSpeed:  {type: "f", value: -0.5, min: -10.0, max: 10.0, step: 0.001},

  minDistance: {type: "f", value: -50.0},
  maxDistance: {type: "f", value: 200.0},

  saturationValue: {type: "f", value: 0.25}, // 0.5
  brightnessValue: {type: "f", value: 0.03}, // 0.3

  loopFadeTimeCenter: {type: "f", value: 1.0, min: 0.0, max: 8.0, step: 0.001},
  loopFadeTimeWidth: {type: "f", value: 3.0, min: 0.0, max: 8.0, step: 0.001},
  loopFadeDuration: {type: "f", value: 3.0, min: 0.0, max: 8.0, step: 0.001},

  loopFadeNoiseScale: {type: "f", value: 9.0, step: 0.05},


  // Glowing Pink; like request
  // backgroundColor: {type: "3fv", value: [0.03, 0.02, 0.06], color: true},
  //
  // outerColor0: {type: "3fv", value: [0.03, 0.2, 0.65], color: true},
  // outerColor1: {type: "3fv", value: [0.63, 0.79, 0.99], color: true},
  //
  // innerColor0: {type: "3fv", value: [0.99, 0.27, 0.12], color: true},
  // innerColor1: {type: "3fv", value: [0.91, 0.76, 0.63], color: true},
  //
  // radius: {type: "f", value: 7.5, step: 0.1},
  // displacementDistance: {type: "f", value: 0.19, step: 0.01}, // 1.4 , 0.01
  //
  // innerRadius: {type: "f", value: 7.6, step: 0.1}, // 6.0, 0.1
  // innerDisplacementDistance: {type: "f", value: 0.8, step: 0.01}, // 0.8, 0.01
  //
  // noiseSpeed: {type: "f", value: 0.098, step: 0.001}, // 0.1, 0.001
  // noiseScale: {type: "f", value: 7.92, step: 0.01}, // 2.0, 0.01
  // noiseMinValue: {type: "f", value: -0.09, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01
  //
  // lineStepSize: {type: "f", value: 0.04, min: 0.0, step: 0.01}, // value: 0.1
  // lineWeight: {type: "f", value: 0.021, min: 0.0, step: 0.001}, // value: 0.008
  // lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},
  //
  // facingCull: {type: "f", value: -1.0, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  // facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},
  //
  // outerOpacity:  {type: "f", value: 0.55, min: 0.0, max: 1.0, step: 0.001},
  // innerOpacity:  {type: "f", value: 0.7, min: 0.0, max: 1.0, step: 0.001},
  //
  // rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  // rotationSpeed:  {type: "f", value: 1.2, min: -10.0, max: 10.0, step: 0.001},
  //
  // minDistance: {type: "f", value: -50.0},
  // maxDistance: {type: "f", value: 200.0},
  //
  // saturationValue: {type: "f", value: 0.25}, // 0.5
  // brightnessValue: {type: "f", value: 0.03}, // 0.3


  // Kleine Eisschollen
  // backgroundColor: {type: "3fv", value: [0.03, 0.02, 0.06], color: true},
  //
  // outerColor0: {type: "3fv", value: [0.0, 0.05, 0.19], color: true},
  // outerColor1: {type: "3fv", value: [0.63, 0.79, 0.99], color: true},
  //
  // innerColor0: {type: "3fv", value: [0.46, 0.44, 0.52], color: true}, // value: [0.99, 0.27, 0.12]
  // innerColor1: {type: "3fv", value: [0.13, 0.13, 0.22], color: true}, // value: [0.91, 0.76, 0.63]
  //
  // radius: {type: "f", value: 7.5, step: 0.1},
  // displacementDistance: {type: "f", value: 0.09, step: 0.01}, // 1.4 , 0.01
  //
  // innerRadius: {type: "f", value: 7.6, step: 0.1}, // 6.0, 0.1
  // innerDisplacementDistance: {type: "f", value: 0.14, step: 0.01}, // 0.8, 0.01
  //
  // noiseSpeed: {type: "f", value: 0.098, step: 0.001}, // 0.1, 0.001
  // noiseScale: {type: "f", value: 100, step: 0.01}, // 2.0, 0.01
  // noiseMinValue: {type: "f", value: -0.09, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01
  //
  // lineStepSize: {type: "f", value: 0.04, min: 0.0, step: 0.01}, // value: 0.1
  // lineWeight: {type: "f", value: 0.021, min: 0.0, step: 0.001}, // value: 0.008
  // lineSmoothing: {type: "f", value: 5.0, min: 0.0, step: 0.001},
  //
  // facingCull: {type: "f", value: -0.4, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  // facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},
  //
  // outerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},
  // innerOpacity:  {type: "f", value: 0.15, min: 0.0, max: 1.0, step: 0.001},
  //
  // rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  // rotationSpeed:  {type: "f", value: 1.2, min: -10.0, max: 10.0, step: 0.001},
  //
  // minDistance: {type: "f", value: -50.0},
  // maxDistance: {type: "f", value: 200.0},
  //
  // saturationValue: {type: "f", value: 0.25}, // 0.5
  // brightnessValue: {type: "f", value: 0.03}, // 0.3

  /**
  // ice glass planet
  backgroundColor: {type: "3fv", value: [0.03, 0.02, 0.06], color: true},

  outerColor0: {type: "3fv", value: [0.0, 0.05, 0.19], color: true},
  outerColor1: {type: "3fv", value: [0.63, 0.79, 0.99], color: true},

  innerColor0: {type: "3fv", value: [0.46, 0.44, 0.52], color: true}, // value: [0.99, 0.27, 0.12]
  innerColor1: {type: "3fv", value: [0.13, 0.13, 0.22], color: true}, // value: [0.91, 0.76, 0.63]

  radius: {type: "f", value: 7.5, step: 0.1},
  displacementDistance: {type: "f", value: 0.19, step: 0.01}, // 1.4 , 0.01

  innerRadius: {type: "f", value: 7.6, step: 0.1}, // 6.0, 0.1
  innerDisplacementDistance: {type: "f", value: 0.8, step: 0.01}, // 0.8, 0.01

  noiseSpeed: {type: "f", value: 0.098, step: 0.001}, // 0.1, 0.001
  noiseScale: {type: "f", value: 7.92, step: 0.01}, // 2.0, 0.01
  noiseMinValue: {type: "f", value: -0.09, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01

  lineStepSize: {type: "f", value: 0.04, min: 0.0, step: 0.01}, // value: 0.1
  lineWeight: {type: "f", value: 0.021, min: 0.0, step: 0.001}, // value: 0.008
  lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},

  facingCull: {type: "f", value: -1, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},

  outerOpacity:  {type: "f", value: 0.55, min: 0.0, max: 1.0, step: 0.001},
  innerOpacity:  {type: "f", value: 0.7, min: 0.0, max: 1.0, step: 0.001},

  rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  rotationSpeed:  {type: "f", value: 1.2, min: -10.0, max: 10.0, step: 0.001},

  minDistance: {type: "f", value: -50.0},
  maxDistance: {type: "f", value: 200.0},

  saturationValue: {type: "f", value: 0.25}, // 0.5
  brightnessValue: {type: "f", value: 0.03}, // 0.3
  **/

  // red-ish
  // outerColor0: {type: "3fv", value: [0.03, 0.2, 0.65], color: true}, // value: [0.03, 0.2, 0.65]
  // outerColor1: {type: "3fv", value: [0.63, 0.79, 0.99], color: true}, // value: [0.63, 0.79, 0.99]
  //
  // innerColor0: {type: "3fv", value: [0.99, 0.27, 0.12], color: true}, // value: [0.99, 0.27, 0.12]
  // innerColor1: {type: "3fv", value: [0.91, 0.76, 0.63], color: true}, // value: [0.91, 0.76, 0.63]

  // blue-green-ish
  // outerColor0: {type: "3fv", value: [0.71, 0.71, 0.74], color: true},
  // outerColor1: {type: "3fv", value: [0.46, 0.7, 1.0], color: true},
  //
  // innerColor0: {type: "3fv", value: [0.14, 0.19, 0.13], color: true},
  // innerColor1: {type: "3fv", value: [0.07, 0.09, 0.26], color: true},
};

main();


function main() {
  gui = initGui(uniforms);

  setup(); // set up scene

  loop(); // start game loop

  tilesaver.init(renderer, scene, camera, TILES);
}


function setup() {

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    // alpha: false
  });

  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 25, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.x = -5.72;
  camera.position.y = -5.80;
  camera.position.z = 13.45;

  const background = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2.0, 2.0),
    new THREE.RawShaderMaterial({
      vertexShader: fullscreenVS,
      fragmentShader: backgroundFS,
      uniforms,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
  );
  background.frustumCulled = false;
  scene.add(background);

  const geometry = new THREE.IcosahedronBufferGeometry(1.0, 5); // change to 8 if more precise geometry needed
  const outerMaterial = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,

    side: THREE.DoubleSide,
    // wireframe: true,
    transparent: true,
    // blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });

  const innerMaterial = new THREE.RawShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.DoubleSide,
    // wireframe: true,
    transparent: true,
    // blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    defines: {
      INNER: true
    }
  });

  for (let i = 0, l = planetPositions.length; i < l; i++) {
    const planetGroup = new THREE.Group();

    planetGroup.position.x = planetPositions[i].x;
    planetGroup.position.y = planetPositions[i].y;
    planetGroup.position.z = planetPositions[i].z;

    addThreeV3Slider(gui, planetGroup.position, `Planet ${i}`);

    const planetInner = new THREE.Mesh(
      geometry,
      innerMaterial
    );
    planetInner.frustumCulled = false;
    planetGroup.add(planetInner);

    const planet = new THREE.Mesh(
      geometry,
      outerMaterial
    );
    planet.frustumCulled = false;
    planetGroup.add(planet);

    scene.add(planetGroup);
  }

  // onResize();
  // window.addEventListener("resize", onResize);

  clock.start();
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  uniforms.aspectRatio.value = camera.aspect;
  camera.updateProjectionMatrix();
}


function loop(time) { // eslint-disable-line no-unused-vars
  loopValue = (time/1000 % loopPeriod) / loopPeriod; // *LOOPING*

  const delta = Math.min(1.0 / 20.0, clock.getDelta());

  if (!RENDERING) {
    // uniforms.time.value += 1/30;// delta;
    uniforms.time.value = loopValue;// delta;
  }

  if (!RENDERING) {
    cancelAnimationFrame(frameRequestId);
    frameRequestId = requestAnimationFrame(loop);
  }
  renderer.render( scene, camera );
  capture.update( renderer );
}

document.addEventListener('keydown', e => {
  if (e.key == ' ') {
    console.log('space');
    RENDERING = !RENDERING;
  } else if (e.key == 'e') {
    tilesaver.save().then(
      (f) => {
        console.log(`Saved to: ${f}`);
        loop();
      }
    );
  } else if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }

  else if (e.key == 'c') {
    capture.startstop(); // start/stop recording
  }
  else if (e.key == 'v') {
    capture.startstop( { duration:loopPeriod } ); // record 10 seconds
  }
});
