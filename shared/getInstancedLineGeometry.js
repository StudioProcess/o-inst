function getInstancedLineGeometry(
  lineWeight,
  count
) {
  const vertices = [
    -1.0, 1.0, 1.0, // TL
    1.0, 1.0, 1.0, // TR
    1.0, -1.0, 0.0, // BR
    -1.0, -1.0, 0.0, // BL
  ];

  const indices = [
    0, 1, 3,
    3, 1, 2
  ];

  const normIds = [];

  

  for (let i = 0; i < count; i++) {
    normIds.push(i / (count - 1));
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
  geometry.addAttribute("normId", new THREE.InstancedBufferAttribute(new Float32Array(normIds), 1));

  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

  return geometry;
}