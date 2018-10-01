import * as capture from '../vendor/recorder.js';



import * as tilesaver from '../app/tilesaver.js';
import {initGui, addThreeV3Slider} from "../shared/generateGui.js";

import vertexShader from "../shaders/tessPlanetVS.js";
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

let gui;

// const numDots = Math.floor(lineSubdivisions / 6);

let frameRequestId;

const planetPositions = [
  {x: 0.0, y: 0.0, z: 0.0}, // {x: -8.3, y: 0.0, z: 0.0}
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
  displacementDistance: {type: "f", value: 10, step: 0.01}, // 1.4 , 0.01

  innerRadius: {type: "f", value: 8.65, step: 0.1}, // 6.0, 0.1
  innerDisplacementDistance: {type: "f", value: 6.0, step: 0.01}, // 0.8, 0.01

  noiseSpeed: {type: "f", value: 0.01, step: 0.001}, // 0.1, 0.001
  noiseScale: {type: "f", value: 10.0, step: 0.01}, // 2.0, 0.01
  noiseMinValue: {type: "f", value: -1.0, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01

  lineStepSize: {type: "f", value: 0.01, min: 0.0, step: 0.01}, // value: 0.1
  lineWeight: {type: "f", value: 0.001, min: 0.0, step: 0.001}, // value: 0.008
  lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},

  facingCull: {type: "f", value: -0.5, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},

  outerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},
  innerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},

  rotationAxis: {type: "3fv", value: [0.4, 1.0, 0.0], min: -1.0, max: 1.0, step: 0.01},
  rotationSpeed:  {type: "f", value: -0.5, min: -10.0, max: 10.0, step: 0.001},

  minDistance: {type: "f", value: -50.0},
  maxDistance: {type: "f", value: 200.0},

  saturationValue: {type: "f", value: 0.25}, // 0.5
  brightnessValue: {type: "f", value: 0.03}, // 0.3



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
  camera.position.z = 15;

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

  const geometry = new THREE.OctahedronBufferGeometry(1.0, 1);
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

  const delta = Math.min(1.0 / 20.0, clock.getDelta());

  if (!RENDERING) {
    uniforms.time.value += 1/30;// delta;
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
    capture.startstop( { duration:10 } ); // record 10 seconds
  }
  else if (e.key == '1'){
    uniforms.backgroundColor.value = [1.0, 1.0, 1.0];

    uniforms.outerColor0.value = [0.0, 0.0, 0.0];
    uniforms.outerColor1.value = [0.0, 0.0, 0.0];

    uniforms.innerColor0.value = [0.0, 0.0, 0.0];
    uniforms.innerColor1.value = [0.0, 0.0, 0.0];

    uniforms.radius.value = 8.7;
    uniforms.displacementDistance.value = 10;

    uniforms.innerRadius.value = 8.65;
    uniforms.innerDisplacementDistance.value = 6.0;

    uniforms.noiseSpeed.value = 0.01;
    uniforms.noiseScale.value = 10.0;
    uniforms.noiseMinValue.value = -1.0;

    uniforms.lineStepSize.value = 0.01;
    uniforms.lineWeight.value = 0.001;
    uniforms.lineSmoothing.value = 6.0;

    uniforms.facingCull.value = -0.5;
    uniforms.facingCullWidth.value = 0.5;

    uniforms.outerOpacity.value = 1.0;
    uniforms.innerOpacity.value = 1.0;

    uniforms.rotationAxis.value = [0.4, 1.0, 0.0];
    uniforms.rotationSpeed.value = -0.5;

    uniforms.minDistance.value = -50.0;
    uniforms.maxDistance.value = 200.0;

    uniforms.saturationValue.value = 0.25;
    uniforms.brightnessValue.value = 0.03;

    camera.position.z = 15;

  }
  else if (e.key == '2') {
    // console.log( Math.floor((Math.random() * 100) + 1) );
    // let random = Math.random() * (+0.001 - +0.0001) + +0.0001;
     // var random = Math.random() * (+max - +min) + +min;
    // console.log ( random );
    // camera.position.z = Math.floor((Math.random() * 20) + 5);
    uniforms.outerColor0.value = [0.0, 0.0, 0.0];
    uniforms.outerColor1.value = [0.0, 0.0, 0.0];
    uniforms.innerColor0.value = [1.0, 1.0, 1.0];
    uniforms.innerColor1.value = [1.0, 1.0, 1.0];

    uniforms.radius.value = 7.9;
    uniforms.displacementDistance.value = 0.77;
    uniforms.innerRadius.value = -2.0;
    uniforms.innerDisplacementDistance.value = 0.34;
    uniforms.noiseSpeed.value = 0.01;
    uniforms.noiseScale.value = 19.26;
    uniforms.noiseMinValue.value = -0.605;
    uniforms.lineStepSize.value = 0.01;
    uniforms.lineWeight.value = 0.003;
    uniforms.lineSmoothing.value = 6.0;
    uniforms.facingCull.value = -0.44;
    uniforms.facingCullWidth.value = 0.498;
    uniforms.outerOpacity.value = 1.0;
    uniforms.innerOpacity.value = 0.0;

    camera.position.z = 40;
  }
  else if (e.key == '3') {
    // console.log( Math.floor((Math.random() * 100) + 1) );
    // let random = Math.random() * (+0.001 - +0.0001) + +0.0001;
     // var random = Math.random() * (+max - +min) + +min;
    // console.log ( random );
    // camera.position.z = Math.floor((Math.random() * 20) + 5);
    uniforms.outerColor0.value = [0.0, 0.0, 0.0];
    uniforms.outerColor1.value = [0.0, 0.0, 0.0];
    uniforms.innerColor0.value = [1.0, 1.0, 1.0];
    uniforms.innerColor1.value = [1.0, 1.0, 1.0];

    uniforms.radius.value = 20.0;
    uniforms.displacementDistance.value = 1.12;
    uniforms.innerRadius.value = 20.0;
    uniforms.innerDisplacementDistance.value = 3.76;
    uniforms.noiseSpeed.value = 3.0;
    uniforms.noiseScale.value = 1.85;
    uniforms.noiseMinValue.value = -1.0;
    uniforms.lineStepSize.value = 0.01;
    uniforms.lineWeight.value = 0.001;
    uniforms.lineSmoothing.value = 3.0;
    uniforms.facingCull.value = -1.0;
    uniforms.facingCullWidth.value = 0.0;
    uniforms.outerOpacity.value = 1.0;
    uniforms.innerOpacity.value = 1.0;

    camera.position.z = 60;
  }
});
