export default `
precision mediump float;

uniform sampler2D pingPongOutMap;
uniform vec2 computeResolution;
uniform float time;

uniform float displaceGain;
uniform float displaceHeight;

uniform float numLines;

uniform vec2 extends;

uniform float lineWeight;

uniform vec2 uvScale;
uniform float uvRotation;
uniform vec2 uvTranslate;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute float extrude;

attribute float uvX;
attribute float uvY;

varying vec2 vUV;

varying float lineBase;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

vec2 getNormal(vec2 p0, vec2 p1, vec2 p2) {
  vec2 prevTang = normalize(p1 - p0);
  vec2 nextTang = normalize(p2 - p1);

  vec2 tangent = normalize(prevTang + nextTang);

  vec2 perp = vec2(-prevTang.y, prevTang.x);
  vec2 miter = vec2(-tangent.y, tangent.x);
  vec2 dir = tangent;
  float len = 1.0 / dot(miter, perp);

  vec2 normal = vec2(-dir.y, dir.x);
  normal *= len/2.0;

  return normal;
}

vec2 getTransformedUV(vec2 uv) {
  uv -= 0.5;
  uv *= uvScale;
  uv = rotate(uv, uvRotation);
  uv -= uvTranslate;
  uv += 0.5;
  return uv;
}

void main()	{

  vec2 prevUV = vec2(uvX - computeResolution.x, uvY);
  vUV = vec2(uvX, uvY);
  vec2 nextUV = vec2(uvX + computeResolution.x, uvY);

  vec4 vPositionPrev = vec4(prevUV, 0.0, 1.0);
  vec4 vPosition = vec4(vUV, 0.0, 1.0);
  vec4 vPositionNext = vec4(nextUV, 0.0, 1.0);

  vPositionPrev.xy -= 0.5;
  vPositionPrev.xy *= extends;
  vPosition.xy -= 0.5;
  vPosition.xy *= extends;
  vPositionNext.xy -= 0.5;
  vPositionNext.xy *= extends;

  prevUV = getTransformedUV(prevUV);
  vUV = getTransformedUV(vUV);
  nextUV = getTransformedUV(nextUV);

  float waveDataPrev = texture2D(pingPongOutMap, prevUV).r;
  vPositionPrev.z += displaceHeight * waveDataPrev;
  vPositionPrev = modelViewMatrix * vPositionPrev;

  float waveData = texture2D(pingPongOutMap, vUV).r;
  vPosition.z += displaceHeight * waveData;
  vPosition = modelViewMatrix * vPosition;

  float waveDataNext = texture2D(pingPongOutMap, nextUV).r;
  vPositionNext.z += displaceHeight * waveDataNext;
  vPositionNext = modelViewMatrix * vPositionNext;

  vec2 extrudeV = getNormal(
    vPositionPrev.xy,
    vPosition.xy,
    vPositionNext.xy
  );

  vPosition.xy += (extrude * lineWeight * vPosition.w) * extrudeV;

	gl_Position = projectionMatrix * vPosition;
}`;