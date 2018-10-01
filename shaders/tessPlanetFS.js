export default `
precision mediump float;

uniform float lineStepSize;
uniform float lineWeight;
uniform float lineSmoothing;

uniform float facingCull;
uniform float facingCullWidth;

uniform float outerOpacity;
uniform float innerOpacity;

uniform vec3 outerColor0;
uniform vec3 outerColor1;

uniform vec3 innerColor0;
uniform vec3 innerColor1;

uniform float saturationValue;
uniform float brightnessValue;

varying float vHeightVal;
varying float vDisplaceNorm;
varying float facing;
varying float distanceVal;


float cubicPulse(float c, float w, float x) {
    x = abs(x - c);
    if( x>w ) return 0.0;
    x /= w;
    return 1.0 - x*x*(3.0-2.0*x);
}

vec3 saturation(vec3 rgb, float adjustment) {
    // Algorithm from Chapter 16 of OpenGL Shading Language
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}

void main() {
  float alpha = mod(vHeightVal, lineStepSize);
  alpha /= lineStepSize;

  alpha *= cubicPulse(0.5, lineWeight / lineStepSize, alpha);
  alpha *= lineSmoothing;
  alpha = min(1.0, alpha);

  alpha *= smoothstep(facingCull - facingCullWidth, facingCull + facingCullWidth, facing);

  vec3 color;

#if defined( INNER)
    color = mix(
      innerColor0,
      innerColor1,
      vDisplaceNorm
    );

    alpha *= innerOpacity;
  #else
    color = mix(
      outerColor0,
      outerColor1,
      vDisplaceNorm
    );
    
    alpha *= outerOpacity;
  #endif

  color = mix(
    saturation(color, saturationValue),
    color,
    distanceVal
  );
  color *= mix(
    brightnessValue,
    1.0,
    distanceVal
  );
  // color *= max(1.0, distanceVal * brightnessValue);

  gl_FragColor = vec4(color, alpha);
  // gl_FragColor = vec4(vec3(distanceVal), alpha);
}
`;