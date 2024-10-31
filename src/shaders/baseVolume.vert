#version 300 es
precision mediump float;

in vec2 aPosition;

#define DATA_SIZE_X 16
#define DATA_SIZE_Y 16
#define DATA_SIZE_Z 16


out vec2 position;

void main() {
    vec3 aPositionn3d = vec3(aPosition, 0.0);

    /*
    gl_Position = vec4(aPositionn3d/vec3(8, 8, 1.)-vec3(1., 1., 0.0), 1.);//vec4(0, 0, 0, 1);
    gl_PointSize = 1.;//float(dataSize);
    // gl_Position = vec4(aPosition, 1.);
    position = (aPositionn3d-vec3(0., 1., 0.))/vec3(8, 8, 1.)-vec3(1., 1., 0.0);
    */


    gl_Position = vec4( (aPositionn3d+vec3(0., 1., 0.))/vec3(DATA_SIZE_X/2, DATA_SIZE_Y/2, 1.)-vec3(1., 1., 0.0), 1.);//vec4(0, 0, 0, 1);
    position = aPosition;
}