/* globals CCapture */

/*
 *  FIXME:
 *  ccapture doesn't work as a module, so we can't loose the dependency in index.html
 *  -> fork / reimplement. only need tar. (webm doesn't work anyway)
 *
 *  no way to know when a capture is done. (event are only dispatched from webmencoder)
 *
 *  repeated captures with startTime + timeLimit yield different results
 *  (also applies to repeated caputres WITHOUT startTime and/or timeLimit)
 *
 *  first recorded frame is wrong (i.e. wrong timimg)
 */

let capturer;
let currentFrame, totalFrames;
export let capturing;

let default_options = {
  format: 'png',
  framerate: 30,
  verbose: false,
  display: true
};

export function start( options ) {
  options = Object.assign({}, default_options, options);
  if (!options.name) {
    options.name = new Date().toISOString();
  }
  if (options.timeLimit) {
    totalFrames = options.framerate * options.timeLimit;
    currentFrame = 0;
    delete options.timeLimit;
  } else {
    totalFrames = 0;
    currentFrame = 0;
  }
  capturer = new CCapture(options);
  capturing = true;
  capturer.start();
}

export function stop() {
  capturer.stop();
  capturer.save();
  capturing = false;
}

export function startstop(options) {
  if (!capturing) start(options);
  else stop();
}

export function update(renderer) {
  if (!capturer) return;
  
  // NOTE: this needs to be called before stop()
  capturer.capture(renderer.domElement);
  
  // FIXME export one extra frame, since the first frame has wrong timing
  if (capturing && totalFrames > 0 && currentFrame++ >= totalFrames+1) {
    stop();
  }
}
