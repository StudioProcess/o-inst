const PingPongRunner = (function() {
  function PingPongRunner() {}

  PingPongRunner.prototype.setup = function(
    camera,
    renderer,
    vertexShader,
    fragmentShader,
    uniforms,
    defines,
    resolutionX,
    resolutionY,
  ) {
    this.camera = camera;
    this.renderer = renderer;
    this.uniforms = uniforms;
    
    this.currentTarget = 0;
    this.renderTargets = [];

    for (let i = 0; i < 2; i++) {
      this.renderTargets[i] = new THREE.WebGLRenderTarget(
        resolutionX,
        resolutionY,
        {
          // minFilter: THREE.NearestFilter,
          // magFilter: THREE.NearestFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
          depthBuffer: false,
          type: THREE.HalfFloatType
        }
      );
    }

    Object.assign(uniforms, {
      pingPongInMap: {
        type: "t",
        value: this.renderTargets[this.currentTarget].texture
      },
      pingPongOutMap: {
        type: "t",
        value: this.renderTargets[1 - this.currentTarget].texture
      }
    });
    this.outputMaterial = new THREE.RawShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms,
      defines
    });
    this.outputScene = new THREE.Scene();
    const mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2.0, 2.0, 1, 1),
      this.outputMaterial
    );
    mesh.frustumCulled = false;
    this.outputScene.add(mesh);
  };

  PingPongRunner.prototype.render = function() {
    this.uniforms.pingPongInMap.value = this.renderTargets[1 - this.currentTarget].texture;
    this.uniforms.pingPongOutMap.value = this.renderTargets[this.currentTarget].texture;
    this.renderer.render(this.outputScene, this.camera, this.renderTargets[this.currentTarget], true);

    this.currentTarget = 1 - this.currentTarget;
  };

  return PingPongRunner;
})();

export default PingPongRunner;
