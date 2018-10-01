import * as capture from '../vendor/recorder.js';

import * as tilesaver from '../app/tilesaver.js';
import {initGui} from "../shared/generateGui.js";

import {inverseLerpClamped, lerp} from "../shared/mathUtils.js";

import fullscreenVS from "../shaders/fullscreenVS.js";
import backgroundFS from "../shaders/backgroundFS.js";

const W = 1280;
const H = 800;

let RENDERING = false;
let TILES = 2;

let numberOfStrains = 1; // 1 or 2
let fadeStrains = false;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let frameRequestId;

const clock = new THREE.Clock();

// *LOOPING*
const loopPeriod = 10; // in seconds
let loopValue = 0; // position inside the loop [0..1)

const numSteps = 90;

const uniforms = {
  time: {type: "f", value: 0.0, hideinGui: true},

  // red bg and taupe colors
  backgroundColor: {type: "3fv", value: [1.0, 0.24, 0.24], color: true},

  colorGroup0A: {type: "3fv", value: [0.9, 0.9, 0.9], color: true},
  colorGroup0B: {type: "3fv", value: [0.82, 0.82, 0.82], color: true},

  colorGroup1A: {type: "3fv", value: [1.0, 1.0, 1.0], color: true},
  colorGroup1B: {type: "3fv", value: [0.85, 0.85, 0.85], color: true},

  // taupe color
  // backgroundColor: {type: "3fv", value: [1.0, 0.99, 0.95], color: true},
  //
  // colorGroup0A: {type: "3fv", value: [0.2, 0.2, 0.2], color: true},
  // colorGroup0B: {type: "3fv", value: [0.9, 0.9, 0.9], color: true},
  //
  // colorGroup1A: {type: "3fv", value: [0.8, 0.8, 0.8], color: true},
  // colorGroup1B: {type: "3fv", value: [0.04, 0.04, 0.04], color: true},

  // // blue, grey
  // backgroundColor: {type: "3fv", value: [0.92, 0.92, 0.92], color: true},
  //
  // colorGroup0A: {type: "3fv", value: [0.11, 0.0, 0.47], color: true},
  // colorGroup0B: {type: "3fv", value: [0.04, 0.01, 0.4], color: true},
  //
  // colorGroup1A: {type: "3fv", value: [0.16, 0.06, 0.33], color: true},
  // colorGroup1B: {type: "3fv", value: [0.04, 0.0, 0.32], color: true},

  point0Center: {type: "3fv", value: [-3.0, -18.0, 0.0]},
  point0Range: {type: "f", value: 0.0},
  point1Center: {type: "3fv", value: [2.0, 3.0, 1.0]},
  point1Range: {type: "f", value: 0.0},
  point2Center: {type: "3fv", value: [1.0, 80.0, 3.0]},
  point2Range: {type: "f", value: 0.0},

  phase: {type: "fv1", value: [0.0, 0.5], hideinGui: true},

  phaseLength: {type: "f", value: 20.0},

  point0: {type: "3fv", value: [-3.0, -18.0, 0.0, -3.0, -18.0, 0.0], hideinGui: true},
  point1: {type: "3fv", value: [2.0, 3.0, 1.0, 2.0, 3.0, 1.0], hideinGui: true},
  point2: {type: "3fv", value: [1.0, 80.0, 3.0, 1.0, 80.0, 3.0], hideinGui: true},

  offsetDistance: {type: "f", value: 8.0},

  dotSize: {type: "f", value: 0.5},
  lineWeight: {type: "f", value: 0.02},

  colorFadeCenter: {type: "f", value: 0.2, min: 0.0, max: 1.0, step: 0.001},
  colorFadeWidth: {type: "f", value: 0.4, min: 0.0, max: 1.0, step: 0.001},

  windings: {type: "f", value: 9.2},
  rotationSpeed: {type: "f", value: Math.PI * 2.0, hideinGui: true},

  noiseOffset: {type: "f", value: 0.4},
  noiseScale: {type: "f", value: 0.1},
  noiseSpeed: {type: "f", value: 2.0, step: 2.0},

  pointsInnerTiming: {type: "4fv", value: [0.0, 0.2, 0.65, 0.8], min: 0.0, max: 1.0, step: 0.001},
  pointsOuterTiming: {type: "4fv", value: [0.15, 0.35, 0.7, 0.95], min: 0.0, max: 1.0, step: 0.001},
  linesTiming: {type: "4fv", value: [0.3, 0.45, 0.6, 0.75], min: 0.0, max: 1.0, step: 0.001},

  pointsFadeInner: {type: "2fv", value: [0.5, 5.0001]},
  pointsFadeOuter: {type: "2fv", value: [0.5, 5.0001]},
  linesFade: {type: "2fv", value: [0.5, 5.0001]},

  pointsFadePosInner: {type: "fv1", value: [0.5, 0.5]},
  pointsFadePosOuter: {type: "fv1", value: [0.5, 0.5]},
  linesFadePos: {type: "fv1", value: [0.5, 0.5]}
};

let phaseCounters = 0;
if( fadeStrains ) {
  phaseCounters = [0.0,uniforms.phaseLength.value * 0.5];
}

main();
function main() {
  setup(); // set up scene

  loop(); // start game loop

  tilesaver.init(renderer, scene, camera, TILES);
  initGui(uniforms);
}


function setup() {

  for (let i = 0; i < 2; i++) {
    onPhaseStep(i);
  }

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    // alpha: true
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.x = -3.0;
  camera.position.y = -10.0;
  camera.position.z = 0.0;
  //-3.0, -18.0, 0.0
  camera.lookAt ( 1.0, 0.0, 3.0 );


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

  const geometry = getInstancedDotGeometry(40, 0.2, numSteps);
  const linesGeometry = getInstancedLineGeometry(1.0, numSteps);

  for (let i = 0; i < numberOfStrains; i++) {
    const centerDots = new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        vertexShader: crispr_dotVS,
        fragmentShader: crispr_dotFS,
        uniforms,
        defines: {
          INDEX: i
        }
        // wireframe: true
      })
    );
    centerDots.frustumCulled = false;
    scene.add(centerDots);

    const offsetDots = new THREE.Mesh(
      geometry,
      new THREE.RawShaderMaterial({
        vertexShader: crispr_dotVS,
        fragmentShader: crispr_dotFS,
        uniforms,
        defines: {
          OFFSET_DOT: true,
          INDEX: i
        }
        // wireframe: true
      })
    );
    offsetDots.frustumCulled = false;
    scene.add(offsetDots);

    const lines = new THREE.Mesh(
      linesGeometry,
      new THREE.RawShaderMaterial({
        vertexShader: crispr_lineVS,
        fragmentShader: crispr_dotFS,
        uniforms,
        side: THREE.DoubleSide,
        defines: {
          INDEX: i
        }
        // wireframe: true
      })
    );
    lines.frustumCulled = false;
    scene.add(lines);
  }

  // onResize();
  // window.addEventListener("resize", onResize);

  clock.start();
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function setRandomV3Array(
  center,
  range,
  target,
  index
) {
  const baseOffset = index * 3;

  for (let i = 0; i < 3; i++) {
    target.value[baseOffset + i] = center.value[i] + 2.0 * (Math.random() - 0.5) * range.value;
  }
}

function onPhaseStep(index) {
  setRandomV3Array(uniforms.point0Center, uniforms.point0Range, uniforms.point0, index);
  setRandomV3Array(uniforms.point1Center, uniforms.point1Range, uniforms.point1, index);
  setRandomV3Array(uniforms.point2Center, uniforms.point2Range, uniforms.point2, index);
}

function getFadeTimings(phase, fade, timings) {
  let value = inverseLerpClamped(timings[0], timings[1], phase) * 0.5;
  value += inverseLerpClamped(timings[2], timings[3], phase) * 0.5;

  value = lerp(
    -fade[0],
    1.0 + fade[0],
    value
  );

  return value;
}



function loop(time) { // eslint-disable-line no-unused-vars
  loopValue = (time/1000 % loopPeriod) / loopPeriod; // *LOOPING*
  // console.log(loopValue);

  // const delta = Math.min(1.0 / 20.0, clock.getDelta());
  const delta = 1.0 / 30.0;

  if (!RENDERING) {
    for (let i = 0, l = phaseCounters.length; i < l; i++) {
      phaseCounters[i] += delta;

      if (phaseCounters[i] > uniforms.phaseLength.value) {
        phaseCounters[i] = 0.0;
        onPhaseStep(i);
      }

      uniforms.phase.value[i] = phaseCounters[i] / uniforms.phaseLength.value;
      uniforms.pointsFadePosInner.value[i] = getFadeTimings(uniforms.phase.value[i], uniforms.pointsFadeInner.value, uniforms.pointsInnerTiming.value);
      uniforms.pointsFadePosOuter.value[i] = getFadeTimings(uniforms.phase.value[i], uniforms.pointsFadeOuter.value, uniforms.pointsOuterTiming.value);
      uniforms.linesFadePos.value[i] = getFadeTimings(uniforms.phase.value[i], uniforms.linesFade.value, uniforms.linesTiming.value);
    }

    uniforms.time.value = loopValue;
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
    capture.startstop( {start:0, duration:loopPeriod} ); // record 1 second
  }
});
