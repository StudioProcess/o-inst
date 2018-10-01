const tessLineVS = `
precision mediump float;

uniform sampler2D positionsMap;

uniform vec2 uvSteps;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float time;
uniform float lineWeight;

attribute float extrude;

attribute float uvX;
attribute float uvY;

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

void main()	{
  vec4 transformed = vec4(1.0);

  vec4 positionData = texture2D(positionsMap, vec2(uvX, uvY));

  vec2 prevPoint = (modelViewMatrix * vec4(texture2D(positionsMap, vec2(uvX - uvSteps.x, uvY)).xyz, 1.0)).xy;
  vec4 curPoint = modelViewMatrix * vec4(texture2D(positionsMap, vec2(uvX, uvY)).xyz, 1.0);
  vec2 nextPoint = (modelViewMatrix * vec4(texture2D(positionsMap, vec2(uvX + uvSteps.x, uvY)).xyz, 1.0)).xy;

  vec2 extrudeV = getNormal(
    prevPoint,
    curPoint.xy,
    nextPoint
  );

  transformed.xyz = curPoint.xyz;

  // extrude line
  transformed.xy += (extrude * lineWeight * curPoint.w) * extrudeV;

	gl_Position = projectionMatrix * transformed;
}`;