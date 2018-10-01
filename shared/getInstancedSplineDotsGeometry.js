export default function getInstancedSplineDotsGeometry(
  resolution,
  dotsPerLine,
  count
) {
  const vertices = [];
  const uvXs = [];
  const indices = [];

  const uvYs = [];

  let relI = 0.0;
  let baseIndex = 0;

  const uvXStep = 1.0 / (dotsPerLine + 1);

  let angle = 0.0;
  const angleStep = (Math.PI * 2.0) / resolution;

  for (let i = 1, l = dotsPerLine - 1; i < l; i++) {

    const baseIndex = vertices.length / 2;

    vertices.push(0.0, 0.0);

    for (let j = 0; j <= resolution; j++) {
      uvXs.push(uvXStep + uvXStep * i);
    }

    angle = 0.0;

    for (let j = 0; j < resolution; j++) {
      vertices.push(
        Math.sin(angle),
        Math.cos(angle),
      );
  
      if (j > 0) {
        indices.push(baseIndex + j, baseIndex, baseIndex + j + 1);
      }
  
      angle += angleStep;
    }
  
    indices.push(baseIndex, baseIndex + 1, baseIndex + resolution);
  }

  for (let i = 0; i < count; i++) {
    uvYs.push(i / count);
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 2));
  geometry.addAttribute("uvX", new THREE.BufferAttribute(new Float32Array(uvXs), 1));

  geometry.addAttribute("uvY", new THREE.InstancedBufferAttribute(new Float32Array(uvYs), 1));

  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

  return geometry;
}