const crispr_dotVS = `
precision mediump float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float time;

uniform vec2 pointsFadeInner;
uniform vec2 pointsFadeOuter;

uniform float pointsFadePosInner[2];
uniform float pointsFadePosOuter[2];

uniform vec3 point0[2];
uniform vec3 point1[2];
uniform vec3 point2[2];

uniform float noiseOffset;
uniform float noiseScale;
uniform float noiseSpeed;

uniform float offsetDistance;
uniform float windings;

uniform float colorFadeCenter;
uniform float colorFadeWidth;

uniform float dotSize;
uniform float rotationSpeed;

uniform vec3 colorGroup0A;
uniform vec3 colorGroup0B;
uniform vec3 colorGroup1A;
uniform vec3 colorGroup1B;

attribute vec2 position;
attribute float normId;

varying vec4 color;

const float PI = 3.14159265359;

// #region noise
//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// #endregion

vec3 Spline(vec3 p1, vec3 p2, vec3 p3, float value) {
	vec3 one = mix(p1, p2, value);
	vec3 two = mix(p2, p3, value);

  return mix(one, two, value);
}

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 getColor(vec2 noisePos, float side) {
  float pickedGroup = clamp(
    (rand(noisePos) - 0.5) * 9999.9,
    0.0,
    1.0
  );

  float pickedSide = clamp(
    (rand(noisePos.yx) - 0.5) * 9999.9,
    0.0,
    1.0
  );

  pickedSide = mix(
    pickedSide,
    1.0 - pickedSide,
    side
  );

  vec3 colorStart = mix(
    colorGroup0A,
    colorGroup1A,
    pickedGroup
  );

  vec3 colorEnd = mix(
    colorGroup0B,
    colorGroup1B,
    pickedGroup
  );

  return mix(
    colorStart,
    colorEnd,
    pickedSide
  );
}

float cubicPulse( float c, float w, float x ) {
    x = abs(x - c);
    if( x > w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0 - 2.0*x);
}

vec4 quat_from_axis_angle(vec3 axis, float angle)
{
  vec4 qr;
  float half_angle = (angle * 0.5) * 3.14159 / 180.0;
  qr.x = axis.x * sin(half_angle);
  qr.y = axis.y * sin(half_angle);
  qr.z = axis.z * sin(half_angle);
  qr.w = cos(half_angle);
  return qr;
}

vec4 quat_conj(vec4 q)
{
  return vec4(-q.x, -q.y, -q.z, q.w);
}

vec4 quat_mult(vec4 q1, vec4 q2)
{
  vec4 qr;
  qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
  qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
  qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
  qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
  return qr;
}

vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle)
{
  vec4 qr = quat_from_axis_angle(axis, angle);
  vec4 qr_conj = quat_conj(qr);
  vec4 q_pos = vec4(position.x, position.y, position.z, 0);

  vec4 q_tmp = quat_mult(qr, q_pos);
  qr = quat_mult(q_tmp, qr_conj);

  return vec3(qr.x, qr.y, qr.z);
}

vec3 noisePos(vec3 position, float index) {
  vec2 loopingPos;

  float noisePhaseTime = time * PI * noiseSpeed;

  loopingPos.x = sin(noisePhaseTime) * noiseScale;
  loopingPos.y = cos(noisePhaseTime) * noiseScale;

  position.x += noiseOffset * snoise(loopingPos.yx);

  loopingPos.x += index;
  position.y -= noiseOffset * snoise(loopingPos);

  loopingPos.x += index;
  loopingPos.y -= index;
  position.y += noiseOffset * snoise(loopingPos);

  return position;
}

void main()	{

  vec3 noisedPoint0 = noisePos(point0[INDEX], 1.0);
  vec3 noisedPoint1 = noisePos(point1[INDEX], 3.0);
  vec3 noisedPoint2 = noisePos(point2[INDEX], 7.0);

  vec4 transformed = vec4(1.0);
  transformed.xyz = Spline(
    noisedPoint0,
    noisedPoint1,
    noisedPoint2,
    normId
  );

  float fadeScaler = pointsFadeInner.y * cubicPulse(pointsFadePosInner[INDEX], pointsFadeInner.x, normId);

  #if defined( OFFSET_DOT )
  fadeScaler = pointsFadeOuter.y * cubicPulse(pointsFadePosOuter[INDEX], pointsFadeOuter.x, normId);

  vec3 forwardV = Spline(
    noisedPoint0,
    noisedPoint1,
    noisedPoint2,
    normId + 0.05
  );

  forwardV = normalize(transformed.xyz - forwardV);
  vec3 offsetV = normalize(
    cross(
      forwardV,
      normalize(cross(forwardV, vec3(1.0, 0.0, 0.0)))
      )
    );
  vec3 offsetU = normalize(cross(forwardV, offsetV));

  float angle = rotationSpeed * time + normId * windings;

  transformed.xyz += (sin(angle) * offsetDistance) * offsetV;
  transformed.xyz += (cos(angle) * offsetDistance) * offsetU;
  #endif

  transformed = modelViewMatrix * transformed;

  #if defined( OFFSET_DOT )
  color = vec4(
    getColor(vec2(normId, 1.0), 1.0),
    1.0
  );

  color.rgb *= colorFadeCenter; // + colorFadeWidth * cos(angle);
  #else
  color = vec4(
    getColor(vec2(normId, 1.0), 0.0),
    1.0
  );
  #endif

  fadeScaler = clamp(fadeScaler, 0.0, 1.0);
  transformed.xy += position.xy * (transformed.w * dotSize * fadeScaler);

	gl_Position = projectionMatrix * transformed;
	// gl_Position = vec4(position, 0.0, 1.0);
}`;
