import * as capture from '../vendor/recorder.js';
import * as tilesaver from './tilesaver.js';
import {initGui, addThreeV3Slider} from "../shared/generateGui.js";

import vertexShader from "../shaders/tessPlanetVS.js";
import fragmentShader from "../shaders/tessPlanetFS.js";

import fullscreenVS from "../shaders/fullscreenVS.js";
import backgroundFS from "../shaders/backgroundFS.js";

const W = 1920;
const H = 1080;

let RENDERING = false;
let TILES = 3;

let colorSpeed = 0.1;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars

// let hue = 359;
// let saturation = 89;
// let lightness = 89;
let hue = 360;
let saturation = 0;
let lightness = 49;
let objectColor = new THREE.Color( "hsl("+hue+", "+saturation+"%, "+lightness+"%)" );

let hueIncrease = true;
let saturationIncrease = true;
let lightnessIncrease = true;
let prevMode = 0;

let invertMode = true;

let clock = new THREE.Clock();
// let delta = clock.getDelta();
// let newMode = 0;

// let startTime = clock.startTime;
// let currentTime = startTime;
// let lastChangedTime = currentTime;
// let elapsedTime;
let waitValue = 5;
let changeCount = 0;

let gui;

let frameRequestId;

const planetPositions = [
  {x: 0.0, y: 0.0, z: 0.0}, // {x: -8.3, y: 0.0, z: 0.0}
  // {x: 18.0, y: 30.0, z: -167.0},
  // {x: 32.5, y: -8.0, z: -60.0},
];

const uniforms = {
  time: {type: "f", value: 0.0, hideinGui: true},
  aspectRatio: {type: "f", value: W / H, hideinGui: true},

  backgroundColor: {type: "3fv", value: new THREE.Color('#1f294b'), color: true},

  outerColor0: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},
  outerColor1: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},

  innerColor0: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},
  innerColor1: {type: "3fv", value: [0.0, 0.0, 0.0], color: true},

  radius: {type: "f", value: 8.7, step: 0.1},
  displacementDistance: {type: "f", value: 10, step: 0.01}, // 1.4 , 0.01

  innerRadius: {type: "f", value: 8.65, step: 0.1}, // 6.0, 0.1
  innerDisplacementDistance: {type: "f", value: 6.0, step: 0.01}, // 0.8, 0.01

  noiseSpeed: {type: "f", value: 0.0001, step: 0.001}, // 0.1, 0.001
  noiseScale: {type: "f", value: 10.0, step: 0.01}, // 2.0, 0.01
  noiseMinValue: {type: "f", value: -1.0, min: -1.0, max: 1.0, step: 0.01}, // -0.2, -1.0, 1.0, 0.01

  lineStepSize: {type: "f", value: 0.01, min: 0.0, step: 0.01}, // value: 0.1
  lineWeight: {type: "f", value: 0.001, min: 0.0, step: 0.001}, // value: 0.008
  lineSmoothing: {type: "f", value: 6.0, min: 0.0, step: 0.001},

  facingCull: {type: "f", value: -0.5, min: -1.0, max: 1.0, step: 0.001}, // value: -0.7
  facingCullWidth: {type: "f", value: 0.5, min: 0.0, step: 0.001},

  outerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},
  innerOpacity:  {type: "f", value: 1.0, min: 0.0, max: 1.0, step: 0.001},

  rotationAxis: {type: "3fv", value: [0.2, 1.0, 1.0], min: -1.0, max: 1.0, step: 0.01},
  rotationSpeed:  {type: "f", value: -0.5, min: -10.0, max: 10.0, step: 0.001},

  minDistance: {type: "f", value: -50.0},
  maxDistance: {type: "f", value: 200.0},

  saturationValue: {type: "f", value: 0.25}, // 0.5
  brightnessValue: {type: "f", value: 0.03}, // 0.3
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
  // renderer.setPixelRatio( window.devicePixelRatio );
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

  // const geometry = new THREE.OctahedronBufferGeometry(1.0, 1);
  const geometry = new THREE.TetrahedronBufferGeometry(1.0, 1);
  // const geometry = new THREE.IcosahedronBufferGeometry(1.0, 5)
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


//"hsl(359, 89%, 89%)"
// e31a1c
// objectColor.setHSL(0.3, 0.7, 0.5); // .setHSL ( h : Float, s : Float, l : Float ) : Color


function loop(time) { // eslint-disable-line no-unused-vars

  if(hueIncrease) {
    hue += 1*colorSpeed;
    if(hue >= 359) {
      hueIncrease = false;
    }
  } else {
    hue -= 1*colorSpeed;
    if(hue <= 1) {
      hueIncrease = true;
    }
  }

  if(saturationIncrease) {
    saturation += 1*colorSpeed;
    if(saturation >= 100) {
      saturationIncrease = false;
    }
  } else {
    saturation -= 1*colorSpeed;
    if(saturation <= 1) {
      saturationIncrease = true;
    }
  }

  // if(lightnessIncrease) {
  //   lightness += 1*colorSpeed;
  //   if(lightness >= 99) {
  //     lightnessIncrease = false;
  //   }
  // } else {
  //   lightness -= 1*colorSpeed;
  //   if(lightness <= 1) {
  //     lightnessIncrease = true;
  //   }
  // }

  // saturation += 1*colorSpeed;
  // if(saturation >= 100) { saturation=0; }
  // lightness += 1*colorSpeed;
  // if(lightness >= 100) { lightness=50; }

  objectColor = new THREE.Color( "hsl("+parseInt(hue)+", "+parseInt(saturation)+"%, "+parseInt(lightness)+"%)" );
  // console.log( "hsl("+parseInt(hue)+", "+parseInt(saturation)+"%, "+parseInt(lightness)+"%)" );

  clock.getElapsedTime();

  if( clock.elapsedTime > (waitValue) ) {

    changeCount++;
    let newWaitValue = Math.floor((Math.random() * 40) + 10); // slow change
    // let newWaitValue = Math.floor((Math.random() * 2) + 1); // fast change
    waitValue += newWaitValue;

    let invertChooser = Math.floor((Math.random() * 10) + 1);
    if(invertChooser >= 5) { invertMode = true; }
    else { invertMode = false; }

    let newMode = Math.floor((Math.random() * 6) + 1);

    if( newMode == 1 && (newMode != prevMode)) {


      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 8.7;
      uniforms.displacementDistance.value = 10;

      uniforms.innerRadius.value = 8.65;
      uniforms.innerDisplacementDistance.value = 6.0;

      uniforms.noiseSpeed.value = 0.001;
      uniforms.noiseScale.value = 10.0;
      uniforms.noiseMinValue.value = -1.0;

      uniforms.lineStepSize.value = 0.01;
      uniforms.lineWeight.value = 0.001;
      uniforms.lineSmoothing.value = 6.0;

      uniforms.facingCull.value = -0.5;
      uniforms.facingCullWidth.value = 0.5;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 1.0;

      uniforms.rotationAxis.value = [0.2, 1.0, 1.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 10.0;
      uniforms.maxDistance.value = 200.0;

      uniforms.saturationValue.value = 0.25;
      uniforms.brightnessValue.value = 0.03;

      camera.position.z = 15;

      console.log("switch to 1 ("+newWaitValue+" seconds)");
    }
    else if( newMode == 2  && (newMode != prevMode)) {
      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 7.9;
      uniforms.displacementDistance.value = 0.77;

      uniforms.innerRadius.value = -2.0;
      uniforms.innerDisplacementDistance.value = 0.34;

      uniforms.noiseSpeed.value = 0.01;
      uniforms.noiseScale.value = 19.26;
      uniforms.noiseMinValue.value = -0.605;

      uniforms.lineStepSize.value = 0.01;
      uniforms.lineWeight.value = 0.003;
      uniforms.lineSmoothing.value = 400.0;

      uniforms.facingCull.value = -0.44;
      uniforms.facingCullWidth.value = 0.498;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 0.0;

      uniforms.rotationAxis.value = [0.4, 1.0, 0.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 100.0;
      uniforms.maxDistance.value = 200.0;

      uniforms.saturationValue.value = 1.0;
      uniforms.brightnessValue.value = 0.03;

      camera.position.z = 8;
      console.log("switch to 2 ("+newWaitValue+" seconds)");
    }
    else if( newMode == 3  && (newMode != prevMode)) {
      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 20.0;
      uniforms.displacementDistance.value = 1.12;

      uniforms.innerRadius.value = 20.0;
      uniforms.innerDisplacementDistance.value = 3.76;

      uniforms.noiseSpeed.value = 0.001; // 0.03
      uniforms.noiseScale.value = 10.0; //  1.85;
      uniforms.noiseMinValue.value = -1.0;

      uniforms.lineStepSize.value = 0.01;
      uniforms.lineWeight.value = 0.001;
      uniforms.lineSmoothing.value = 20.0;

      uniforms.facingCull.value = -1.0;
      uniforms.facingCullWidth.value = 0.0;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 1.0;

      uniforms.rotationAxis.value = [0.4, 1.0, 0.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 100.0;
      uniforms.maxDistance.value = 500.0;

      uniforms.saturationValue.value = 1.0;
      uniforms.brightnessValue.value = 1.0;

      camera.position.z = 25;
      console.log("switch to 3 ("+newWaitValue+" seconds)");
    }
    else if( newMode == 4  && (newMode != prevMode)) {
      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 7.9;
      uniforms.displacementDistance.value = 0.77;

      uniforms.innerRadius.value = 7.9;
      uniforms.innerDisplacementDistance.value = 0.34;

      uniforms.noiseSpeed.value = 0.01;
      uniforms.noiseScale.value = 19.26;
      uniforms.noiseMinValue.value = -0.605;

      uniforms.lineStepSize.value = 0.22;
      uniforms.lineWeight.value = 0.011;
      uniforms.lineSmoothing.value = 190.0;

      uniforms.facingCull.value = -0.44;
      uniforms.facingCullWidth.value = 0.498;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 0.0;

      uniforms.rotationAxis.value = [0.4, 0.1, 1.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 0.0;
      uniforms.maxDistance.value = 500.0;

      uniforms.saturationValue.value = 0.25;
      uniforms.brightnessValue.value = 0.03;

      camera.position.z = 20;
      console.log("switch to 4 ("+newWaitValue+" seconds)");
    }
    else if( newMode == 5  && (newMode != prevMode)) {
      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 17.9;
      uniforms.displacementDistance.value = 1.77;

      uniforms.innerRadius.value = 7.9;
      uniforms.innerDisplacementDistance.value = 0.34;

      uniforms.noiseSpeed.value = 0.001;
      uniforms.noiseScale.value = 190.26;
      uniforms.noiseMinValue.value = -0.605;

      uniforms.lineStepSize.value = 0.22;
      uniforms.lineWeight.value = 0.011;
      uniforms.lineSmoothing.value = 190.0;

      uniforms.facingCull.value = -0.44;
      uniforms.facingCullWidth.value = 0.498;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 0.0;

      uniforms.rotationAxis.value = [1.0, 1.0, 1.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 0.0;
      uniforms.maxDistance.value = 500.0;

      uniforms.saturationValue.value = 0.25;
      uniforms.brightnessValue.value = 0.03;

      camera.position.z = 40;
      console.log("switch to 5 ("+newWaitValue+" seconds)");
    }
    else if( newMode == 6  && (newMode != prevMode)) {
      if(invertMode){
        uniforms.backgroundColor.value = new THREE.Color('#FFFFFF');

        uniforms.outerColor0.value = new THREE.Color('#000000');
        uniforms.outerColor1.value = new THREE.Color('#000000');

        uniforms.innerColor0.value = new THREE.Color('#000000');
        uniforms.innerColor1.value = new THREE.Color('#000000');
      } else {
        uniforms.backgroundColor.value = new THREE.Color('#000000');

        uniforms.outerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.outerColor1.value = new THREE.Color('#FFFFFF');

        uniforms.innerColor0.value = new THREE.Color('#FFFFFF');
        uniforms.innerColor1.value = new THREE.Color('#FFFFFF');
      }

      uniforms.radius.value = 15.1;
      uniforms.displacementDistance.value = 12.56;

      uniforms.innerRadius.value = 6.8;
      uniforms.innerDisplacementDistance.value = 0.34;

      uniforms.noiseSpeed.value = 0.0001;
      uniforms.noiseScale.value = 10.00;
      uniforms.noiseMinValue.value = -0.605;

      uniforms.lineStepSize.value = 0.22;
      uniforms.lineWeight.value = 0.011;
      uniforms.lineSmoothing.value = 150.0;

      uniforms.facingCull.value = -0.44;
      uniforms.facingCullWidth.value = 0.498;

      uniforms.outerOpacity.value = 1.0;
      uniforms.innerOpacity.value = 0.0;

      uniforms.rotationAxis.value = [-1.0, -1.0, 1.0];
      uniforms.rotationSpeed.value = -0.5;

      uniforms.minDistance.value = 0.0;
      uniforms.maxDistance.value = 500.0;

      uniforms.saturationValue.value = 0.25;
      uniforms.brightnessValue.value = 0.03;

      camera.position.x = 2;
      camera.position.y = 0;
      camera.position.z = 38;
      console.log("switch to 6 ("+newWaitValue+" seconds)");
    }

    prevMode = newMode;
  }

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

function enterFullscreen() {
  if (!document.webkitFullscreenElement) {
    document.querySelector('body').webkitRequestFullscreen();
    gui.close();
    controls.enabled = false;
  }
}

// enable controls when exiting fullscreen
document.addEventListener('webkitfullscreenchange', () => {
  if (!document.webkitFullscreenElement) {
    controls.enabled = true;
  }
});

document.addEventListener('dblclick', e => {
  enterFullscreen();
  e.preventDefault();
});

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
    enterFullscreen();
  } 
  else if (e.key == 'h') {
    if (!document.webkitFullscreenElement) {
      if (gui.closed) gui.open();
      else gui.close();
    }
  }
  else if (e.key == 'c') {
    capture.startstop(); // start/stop recording
  }
  else if (e.key == 'v') {
    capture.startstop( { duration:10 } ); // record 10 seconds
  }
});
