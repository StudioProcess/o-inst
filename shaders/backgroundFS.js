export default `
precision mediump float;

uniform vec3 backgroundColor;

void main()	{
  gl_FragColor = vec4(backgroundColor, 1.0);
}`;