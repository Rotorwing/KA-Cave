class HDGIPlugin extends BABYLON.MaterialPluginBase {
    constructor(material, name, volumeDimensions, scaling) {
        super(material, name, 100, {
            "DATA_SCALING": `vec3(${1/(volumeDimensions.x*scaling)}, ${1/(volumeDimensions.y*scaling)}, ${1/(volumeDimensions.z*scaling)})`
        });
        this._enable(true);

        this.volumeDimensions = volumeDimensions;
        this.scaling = scaling;

        this.texturesBound = false;

        let blankTex3D = () => new BABYLON.RawTexture3D(new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y*this.volumeDimensions.z*4), this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z, BABYLON.Engine.TEXTUREFORMAT_RGBA, scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        this.voxelMeshGITextureXP = blankTex3D();
        this.voxelMeshGITextureYP = blankTex3D();
        this.voxelMeshGITextureZP = blankTex3D();
        this.voxelMeshGITextureXN = blankTex3D();
        this.voxelMeshGITextureYN = blankTex3D();
        this.voxelMeshGITextureZN = blankTex3D();
    }
    getClassName() {
        return "HDGIPlugin"
    }
    getSamplers(samplers) {
        samplers.push("XPSampler");
        samplers.push("YPSampler");
        samplers.push("ZPSampler");
        samplers.push("XNSampler");
        samplers.push("YNSampler");
        samplers.push("ZNSampler");

    }

    bindForSubMesh(uniformBuffer, scene, engine, subMesh){

        // if(!this.texturesBound){
            
            uniformBuffer.setTexture("XPSampler", this.voxelMeshGITextureXP);
            uniformBuffer.setTexture("YPSampler", this.voxelMeshGITextureYP);
            uniformBuffer.setTexture("ZPSampler", this.voxelMeshGITextureZP);
            uniformBuffer.setTexture("XNSampler", this.voxelMeshGITextureXN);
            uniformBuffer.setTexture("YNSampler", this.voxelMeshGITextureYN);
            uniformBuffer.setTexture("ZNSampler", this.voxelMeshGITextureZN);

            // uniformBuffer.updateVector3("DATA_SCALING", new BABYLON.Vector3(1/(this.volumeDimensions.x*this.scaling), 1/(this.volumeDimensions.y*this.scaling), 1/(this.volumeDimensions.z*this.scaling)));

            // console.log("bind");
            // this.texturesBound = true;
        // }
    }

    setGiTextureData(data){
        this.voxelMeshGITextureXP.update(data[0]);
        this.voxelMeshGITextureYP.update(data[1]);
        this.voxelMeshGITextureZP.update(data[2]);
        this.voxelMeshGITextureXN.update(data[3]);
        this.voxelMeshGITextureYN.update(data[4]);
        this.voxelMeshGITextureZN.update(data[5]);
        this.texturesBound = false;
    }


    getCustomCode(shaderType){
        if(shaderType === "vertex"){
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
out vec3 vPosition;
out vec3 vNormal;
`,
                CUSTOM_VERTEX_MAIN_END: `
vPosition = position;
vNormal = normal;
`
            }
        }else if(shaderType === "fragment"){
            return {
                ADDITIONAL_FRAGMENT_DECLARATION:`
precision mediump sampler3D;
uniform sampler3D XPSampler;
uniform sampler3D YPSampler;
uniform sampler3D ZPSampler;
uniform sampler3D XNSampler;
uniform sampler3D YNSampler;
uniform sampler3D ZNSampler;

// uniform vec3 DATA_SCALING;
in vec3 vPosition;
in vec3 vNormal;
`,
                CUSTOM_IMAGEPROCESSINGFUNCTIONS_DEFINITIONS: `
vec4 mix3(vec4 a, vec4 b, vec4 c, float v){
    vec4 ab = mix(a, b, clamp(v+1., 0., 1.0));
    return mix(ab, c, clamp(v, 0., 1.0));
}
float mix3(float a, float b, float c, float v){
    float ab = mix(a, b, clamp(v+1., 0., 1.0));
    return mix(ab, c, clamp(v, 0., 1.0));
}
vec4 mixLightSamples(vec4 samples[6], vec3 normal){
    vec3 mixNormal = (normal+vec3(1.))/2.;
    vec4 xColor = mix(samples[0], samples[3], clamp(mixNormal.x, 0., 1.));
    vec4 yColor = mix(samples[1], samples[4], clamp(mixNormal.y, 0., 1.));
    vec4 zColor = mix(samples[2], samples[5], clamp(mixNormal.z, 0., 1.));
    return (xColor+yColor+zColor)/3.;
}
`,
                CUSTOM_FRAGMENT_DEFINITIONS: `
const vec3 DIRECTIONS[6] = vec3[6](
    vec3(1., 0., 0.),
    vec3(0., 1., 0.),
    vec3(0., 0., 1.),
    vec3(-1., 0., 0.),
    vec3(0., -1., 0.),
    vec3(0., 0., -1.)
);
`,
                CUSTOM_FRAGMENT_BEFORE_LIGHTS: `
    vec3 samplePosition = vec3(vPosition.x, vPosition.z, vPosition.y)*DATA_SCALING;
    vec4 lightSamples[6];
    lightSamples[0] = texture(XPSampler, samplePosition);
    lightSamples[1] = texture(YPSampler, samplePosition);
    lightSamples[2] = texture(ZPSampler, samplePosition);
    lightSamples[3] = texture(XNSampler, samplePosition);
    lightSamples[4] = texture(YNSampler, samplePosition);
    lightSamples[5] = texture(ZNSampler, samplePosition);

    vec3 normal = normalize(vNormal);
    mat3 TBNl = cotangent_frame(normal*normalScale, vPositionW, TBNUV, vTangentSpaceParams);
    // normalW = perturbNormal(TBN, texture(bumpSampler, vBumpUV+uvOffset).xyz, vBumpInfos.y);
    normal = perturbNormal(tangentSpace, triPlanarSample(bumpSampler, normalTW).xyz, vBumpInfos.y);
    
    vec4 giColor = mixLightSamples(lightSamples, normal);
    // baseAmbientColor.rgb += giColor.rgb*0.5;
`,
                CUSTOM_LIGHT0_COLOR:`
specularBase+=pow(mixLightSamples(lightSamples, reflect(viewDirectionW, normalW)).rgb, vec3(3.))*0.5;`,
                CUSTOM_FRAGMENT_BEFORE_FOG:`
color.rgb += baseColor.rgb*giColor.rgb*3.5;`
            }
        }
    }
}