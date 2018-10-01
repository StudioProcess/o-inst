const DynamicRenderTextureRunner = (function() {
  function DynamicRenderTextureRunner() {
    this.skipPostProcessing = false;
  }

  DynamicRenderTextureRunner.prototype.setup = function(
    camera,
    renderer,
    vertexShader,
    fragmentShader,
    uniforms,
    resolutionX,
    resolutionY,
  ) {
    this.camera = camera;
    this.renderer = renderer;
    
    this.renderTarget = new THREE.WebGLRenderTarget(
      resolutionX,
      resolutionY,
      {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        type: THREE.HalfFloatType,
      }
    );

    this.outputMaterial = new THREE.RawShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms,
    });

    this.outputScene = new THREE.Scene();
    this.outputScene.add(new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2.0, 2.0, 1, 1),
      this.outputMaterial)
    );

    return this.renderTarget.texture;
  };

  DynamicRenderTextureRunner.prototype.render = function() {
    this.renderer.render(this.outputScene, this.camera, this.renderTarget);
  };

  return DynamicRenderTextureRunner;
})();
