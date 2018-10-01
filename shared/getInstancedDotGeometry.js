function getInstancedDotGeometry(
  resolution,
  radius,
  count
) {
  const vertices = [];
  const normIds = [];
  const indices = [];

  vertices.push(0.0, 0.0);

  let angle = 0.0;
  const angleStep = (Math.PI * 2.0) / resolution;

  for (let i = 0; i < resolution; i++) {
    vertices.push(
      Math.sin(angle) * radius,
      Math.cos(angle) * radius,
      // 0.0
    );

    if (i > 0) {
      indices.push(i, 0, i + 1);
    }

    angle += angleStep;
  }

  indices.push(0, 1, resolution);

  for (let i = 0; i < count; i++) {
    normIds.push(i / (count - 1));
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 2));
  geometry.addAttribute("normId", new THREE.InstancedBufferAttribute(new Float32Array(normIds), 1));

  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

  return geometry;
}