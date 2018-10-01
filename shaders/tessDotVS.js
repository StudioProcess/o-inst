export default `
precision mediump float;

uniform sampler2D positionsMap;

uniform float dotSize;
uniform float dotRandomOffset;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float time;

attribute vec2 position;

attribute float uvX;
attribute float uvY;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()	{
  vec4 transformed = vec4(1.0);

  float uvOffset = dotRandomOffset * (rand(vec2(uvX, uvY)) - 0.5);

  vec3 positionData = texture2D(positionsMap, vec2(uvX + uvOffset, uvY)).xyz;

  vec4 curPoint = modelViewMatrix * vec4(positionData, 1.0);

  curPoint.xy += (dotSize * curPoint.w) * position.xy;

	gl_Position = projectionMatrix * curPoint;
}`;