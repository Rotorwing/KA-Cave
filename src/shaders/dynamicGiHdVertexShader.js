window.dynamicGiHdVertexShader = `#version 300 es

precision highp float;
precision mediump sampler3D;

in vec3 position;
in vec3 normal;
uniform mat4 viewProjection;

uniform mat4 world;

uniform mat4 view;

out vec3 vPositionW;
out vec3 vNormal;
out vec3 vPosition;

void main(void) {
    vec3 positionUpdated = position;

    mat4 finalWorld = world;
    vec4 worldPos = finalWorld*vec4(positionUpdated, 1.0);

    gl_Position = viewProjection*worldPos;//vec4(position, 1.0);//worldPos;

    vPositionW = vec3(worldPos);
    vPosition = position;

    vNormal = normal;
}

`;