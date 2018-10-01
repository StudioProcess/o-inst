export default `
precision mediump float;

uniform vec3 lineColor;

void main()	{
  gl_FragColor = vec4(lineColor, 1.0);
}`;