varying vec3 pos;
varying vec2 UVs;

/* Main vertex shader function */
void main( void ) {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  pos = position;
  UVs = uv;
} /* End of 'main' function */
