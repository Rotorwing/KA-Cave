window.dynamicGiHdFragmentShader = `#version 300 es

precision highp float;
precision mediump sampler3D;

uniform vec3 vEmissiveColor;
uniform vec3 vAmbientColor;
uniform float visibility;


uniform vec4 vEyePosition;
uniform vec4 vDiffuseColor;

in vec3 vPositionW;
in vec3 vNormal;
in vec3 vPosition;

uniform sampler3D XPSampler;
uniform sampler3D YPSampler;
uniform sampler3D ZPSampler;
uniform sampler3D XNSampler;
uniform sampler3D YNSampler;
uniform sampler3D ZNSampler;

uniform vec3 DATA_SCALING;

const vec3 DIRECTIONS[6] = vec3[6](
    vec3(1., 0., 0.),
    vec3(0., 1., 0.),
    vec3(0., 0., 1.),
    vec3(-1., 0., 0.),
    vec3(0., -1., 0.),
    vec3(0., 0., -1.)
);


vec4 mix3(vec4 a, vec4 b, vec4 c, float v){
    vec4 ab = mix(a, b, clamp(v+1., 0., 1.0));
    return mix(ab, c, clamp(v, 0., 1.0));
}
float mix3(float a, float b, float c, float v){
    float ab = mix(a, b, clamp(v+1., 0., 1.0));
    return mix(ab, c, clamp(v, 0., 1.0));
}

layout(location = 0) out vec4 glFragColor;
void main(void) {
    vec3 viewDirectionW = normalize(vEyePosition.xyz-vPositionW);
    vec4 baseColor = vec4(1., 1., 1., 1.);
    vec3 diffuseColor = vDiffuseColor.rgb;
    vec3 normalW = normalize(-cross(dFdx(vPositionW), dFdy(vPositionW)));
    float alpha = vDiffuseColor.a;

    vec3 baseAmbientColor = vec3(1., 1., 1.);

    float glossiness = 0.;
    vec3 diffuseBase = vec3(0., 0., 0.);

    
    vec3 samplePosition = vec3(vPosition.x, vPosition.z, vPosition.y)*DATA_SCALING;
    vec4 lightSamples[6];
    lightSamples[0] = texture(XPSampler, samplePosition);
    lightSamples[1] = texture(YPSampler, samplePosition);
    lightSamples[2] = texture(ZPSampler, samplePosition);
    lightSamples[3] = texture(XNSampler, samplePosition);
    lightSamples[4] = texture(YNSampler, samplePosition);
    lightSamples[5] = texture(ZNSampler, samplePosition);
    

    // color.a *= visibility;
    vec3 mixNormal = (vNormal+vec3(1.))/2.;
    // vec4 xColor = mix(giColors[0], giColors[3], clamp(mixNormal.x-giColors[0].a+giColors[3].a, 0., 1.));
    // vec4 yColor = mix(giColors[1], giColors[4], clamp(mixNormal.y-giColors[1].a+giColors[4].a, 0., 1.));
    // vec4 zColor = mix(giColors[2], giColors[5], clamp(mixNormal.z-giColors[2].a+giColors[5].a, 0., 1.));
    vec4 xColor = mix(lightSamples[0], lightSamples[3], clamp(mixNormal.x, 0., 1.));
    vec4 yColor = mix(lightSamples[1], lightSamples[4], clamp(mixNormal.y, 0., 1.));
    vec4 zColor = mix(lightSamples[2], lightSamples[5], clamp(mixNormal.z, 0., 1.));
    // vec4 xColor = mix3(giColors[0], giColors[6], giColors[3], clamp(mixNormal.x-giColors[0].a+giColors[3].a, 0., 1.));
    // vec4 yColor = mix3(giColors[1], giColors[6], giColors[4], clamp(mixNormal.y-giColors[1].a+giColors[4].a, 0., 1.));
    // vec4 zColor = mix3(giColors[2], giColors[6], giColors[5], clamp(mixNormal.z-giColors[2].a+giColors[5].a, 0., 1.));
    

    // vec4 finalColor = (xColor*(1.-xColor.a)+
    //                    yColor*(1.-yColor.a)+
    //                    zColor*(1.-zColor.z)+
    //                    giColors[6])/
    //                    (4. - xColor.a - yColor.a - zColor.a);
    
    // vec4 finalColor = (xColor*(1.-xColor.a)+
    //                    yColor*(1.-yColor.a)+
    //                    zColor*(1.-zColor.z))/
    //                    (3. - xColor.a - yColor.a - zColor.a);

    vec4 finalColor = (xColor+yColor+zColor)/3.;

    finalColor.a = 1.;
    // glFragColor = vColor;
    // glFragColor = vec4(vCellPosition/vec3(128., 128., 64.), 1.);
    // glFragColor = vec4(finalColor.rgb, 1.);
    // glFragColor = vec4(vec3(mix3(giColors[0].a, giColors[6].a, giColors[3].a, mixNormal.x)), 1.);
    // glFragColor = vec4(mixNormal, 1.);
    // glFragColor = vec4(giColor.rgb, 1.);

    // glFragColor = vec4(giColors[3].r, 1., 1., 1.);
    glFragColor = finalColor;

    // glFragColor = vec4(1.0, 0.0, 0.0, 1.0);
}

`;