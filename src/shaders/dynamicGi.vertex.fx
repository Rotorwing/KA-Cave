#version 300 es

precision highp float;
precision mediump sampler3D;

in vec3 position;
in vec3 normal;
uniform mat4 viewProjection;

uniform mat4 world;

uniform mat4 view;

out vec3 vPositionW;
out vec3 vNormal;

out vec4 vColor;

uniform sampler3D XPSampler;
uniform sampler3D YPSampler;
uniform sampler3D ZPSampler;
uniform sampler3D XNSampler;
uniform sampler3D YNSampler;
uniform sampler3D ZNSampler;

out vec4 giColor;
out vec4 giColors[6];

uniform vec3 DATA_SCALING;

const vec3 DIRECTIONS[6] = vec3[6](
    vec3(1., 0., 0.),
    vec3(0., 1., 0.),
    vec3(0., 0., 1.),
    vec3(-1., 0., 0.),
    vec3(0., -1., 0.),
    vec3(0., 0., -1.)
);

void main(void) {
    vec3 positionUpdated = position;

    mat4 finalWorld = world;
    vec4 worldPos = finalWorld*vec4(positionUpdated, 1.0);

    gl_Position = viewProjection*worldPos;//vec4(position, 1.0);//worldPos;

    vPositionW = vec3(worldPos);
    vec2 uvUpdated = vec2(0., 0.);

    giColor = vec4(0.);

    vec3 samplePosition = vec3(position.x, position.z, position.y)*DATA_SCALING;
    vec4 lightSamples[6];
    lightSamples[0] = texture(XPSampler, samplePosition);
    lightSamples[1] = texture(YPSampler, samplePosition);
    lightSamples[2] = texture(ZPSampler, samplePosition);
    lightSamples[3] = texture(XNSampler, samplePosition);
    lightSamples[4] = texture(YNSampler, samplePosition);
    lightSamples[5] = texture(ZNSampler, samplePosition);

    for(int i = 0; i < 6; i++) {
        vec3 direction = DIRECTIONS[i];
        vec4 light = lightSamples[i];
        giColor += light * min(0.0, dot(normal, direction));
    }

    giColors[0] = lightSamples[0];
    giColors[1] = lightSamples[1];
    giColors[2] = lightSamples[2];
    giColors[3] = lightSamples[3];
    giColors[4] = lightSamples[4];
    giColors[5] = lightSamples[5];

    giColor = lightSamples[0];  // DEBUG

    vNormal = normal;
}
